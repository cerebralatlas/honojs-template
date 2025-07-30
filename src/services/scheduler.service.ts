import * as cron from 'node-cron'
import { logger } from '../config/logger.js'
import { metricsService } from './metrics.service.js'
import { env } from '../config/env.js'

export interface CronJobConfig {
  name: string
  schedule: string
  task?: () => Promise<void>
  execute?: (context: CronJobContext) => Promise<CronJobStatus>
  enabled?: boolean
  timezone?: string
  description?: string
}

export interface CronJobStatus {
  name?: string
  schedule?: string
  nextExecution?: Date | null
  lastExecution?: Date | null
  isRunning?: boolean
  enabled?: boolean
  description?: string
  executionCount?: number
  lastError?: string
  success: boolean
  message: string
  duration: number
  error?: string
  metadata?: Record<string, any>
}

export interface CronJobContext {
  jobName: string
  startTime: number
}

export class SchedulerService {
  private jobs: Map<string, { task: cron.ScheduledTask; config: CronJobConfig; status: CronJobStatus }> = new Map()
  
  constructor() {
    logger.info('🕐 Scheduler service initialized')
  }

  /**
   * Register a new cron job
   */
  registerJob(config: CronJobConfig): boolean {
    try {
      if (this.jobs.has(config.name)) {
        logger.warn(`Cron job '${config.name}' already exists, skipping registration`)
        return false
      }

      if (!cron.validate(config.schedule)) {
        throw new Error(`Invalid cron expression: ${config.schedule}`)
      }

      const status: CronJobStatus = {
        name: config.name,
        schedule: config.schedule,
        nextExecution: null,
        lastExecution: null,
        isRunning: false,
        enabled: config.enabled ?? true,
        description: config.description,
        executionCount: 0,
        lastError: undefined,
        success: false,
        message: 'Not executed yet',
        duration: 0
      }

      const wrappedTask = async () => {
        if (status.isRunning) {
          logger.warn(`Cron job '${config.name}' is already running, skipping execution`)
          return
        }

        status.isRunning = true
        status.lastExecution = new Date()
        status.executionCount = (status.executionCount || 0) + 1
        
        const startTime = Date.now()
        
        try {
          logger.info(`🟢 Starting cron job: ${config.name}`)
          
          let jobResult: CronJobStatus | undefined
          
          if (config.execute) {
            // Use new execute method
            const context: CronJobContext = {
              jobName: config.name,
              startTime
            }
            jobResult = await config.execute(context)
          } else if (config.task) {
            // Use legacy task method
            await config.task()
            const duration = Date.now() - startTime
            jobResult = {
              success: true,
              message: `Job completed successfully`,
              duration
            }
          } else {
            throw new Error('No task or execute function provided')
          }
          
          // Update status from job result
          Object.assign(status, jobResult)
          
          const duration = Date.now() - startTime
          logger.info(`✅ Cron job '${config.name}' completed in ${duration}ms`)
          status.lastError = undefined
          
          // Record successful execution metrics
          if (env.ENABLE_MONITORING) {
            metricsService.recordSchedulerJobExecution(config.name, true, duration / 1000)
          }
          
        } catch (error) {
          const duration = Date.now() - startTime
          status.lastError = error instanceof Error ? error.message : 'Unknown error'
          status.success = false
          status.message = status.lastError
          status.duration = duration
          
          logger.error({
            error,
            job: config.name,
            duration
          }, `❌ Cron job '${config.name}' failed`)
          
          // Record failed execution metrics
          if (env.ENABLE_MONITORING) {
            metricsService.recordSchedulerJobExecution(config.name, false, duration / 1000)
          }
        } finally {
          status.isRunning = false
          this.updateNextExecution(config.name)
        }
      }

      const task = cron.schedule(config.schedule, wrappedTask, {
        timezone: config.timezone || 'UTC'
      })
      
      // Stop the task initially if not enabled
      if (!status.enabled) {
        task.stop()
      }

      this.jobs.set(config.name, { task, config, status })
      this.updateNextExecution(config.name)

      if (status.enabled) {
        task.start()
        logger.info(`✅ Cron job '${config.name}' registered and started`)
      } else {
        logger.info(`➡️  Cron job '${config.name}' registered but disabled`)
      }

      return true
    } catch (error) {
      logger.error({ error, jobName: config.name }, 'Failed to register cron job')
      return false
    }
  }

  /**
   * Start a specific job or all jobs
   */
  startJob(name?: string): boolean {
    try {
      if (name) {
        const job = this.jobs.get(name)
        if (!job) {
          logger.warn(`Cron job '${name}' not found`)
          return false
        }
        
        job.task.start()
        job.status.enabled = true
        this.updateNextExecution(name)
        logger.info(`▶️  Started cron job: ${name}`)
        return true
      } else {
        // Start all jobs
        this.jobs.forEach((job, jobName) => {
          if (!job.status.enabled) {
            job.task.start()
            job.status.enabled = true
            this.updateNextExecution(jobName)
          }
        })
        logger.info('▶️  Started all cron jobs')
        return true
      }
    } catch (error) {
      logger.error({ error, jobName: name }, 'Failed to start cron job(s)')
      return false
    }
  }

  /**
   * Stop a specific job or all jobs
   */
  stopJob(name?: string): boolean {
    try {
      if (name) {
        const job = this.jobs.get(name)
        if (!job) {
          logger.warn(`Cron job '${name}' not found`)
          return false
        }
        
        job.task.stop()
        job.status.enabled = false
        job.status.nextExecution = null
        logger.info(`⏸️  Stopped cron job: ${name}`)
        return true
      } else {
        // Stop all jobs
        this.jobs.forEach((job) => {
          job.task.stop()
          job.status.enabled = false
          job.status.nextExecution = null
        })
        logger.info('⏸️  Stopped all cron jobs')
        return true
      }
    } catch (error) {
      logger.error({ error, jobName: name }, 'Failed to stop cron job(s)')
      return false
    }
  }

  /**
   * Remove a job completely
   */
  removeJob(name: string): boolean {
    try {
      const job = this.jobs.get(name)
      if (!job) {
        logger.warn(`Cron job '${name}' not found`)
        return false
      }

      job.task.destroy()
      this.jobs.delete(name)
      logger.info(`🗑️  Removed cron job: ${name}`)
      return true
    } catch (error) {
      logger.error({ error, jobName: name }, 'Failed to remove cron job')
      return false
    }
  }

  /**
   * Get status of all jobs or a specific job
   */
  getJobStatus(name?: string): CronJobStatus | CronJobStatus[] | null {
    if (name) {
      const job = this.jobs.get(name)
      return job ? { ...job.status } : null
    }

    return Array.from(this.jobs.values()).map(job => ({ ...job.status }))
  }

  /**
   * Get list of all job names
   */
  getJobNames(): string[] {
    return Array.from(this.jobs.keys())
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(name: string): Promise<boolean> {
    try {
      const job = this.jobs.get(name)
      if (!job) {
        logger.warn(`Cron job '${name}' not found`)
        return false
      }

      logger.info(`🔧 Manually triggering job: ${name}`)
      
      if (job.status.isRunning) {
        logger.warn(`Job '${name}' is already running`)
        return false
      }

      // Execute the task directly
      if (job.config.task) {
        await job.config.task()
      } else if (job.config.execute) {
        await job.config.execute({ jobName: name, startTime: Date.now() })
      }
      return true
      
    } catch (error) {
      logger.error({ error, jobName: name }, 'Failed to trigger cron job')
      return false
    }
  }

  /**
   * Update next execution time for a job
   */
  private updateNextExecution(name: string): void {
    try {
      const job = this.jobs.get(name)
      if (!job || !job.status.enabled) return

      // Use a simple calculation - this is approximate
      // For production, you might want to use a more sophisticated cron parser
      const now = new Date()
      const next = new Date(now.getTime() + 60000) // Rough estimate, add 1 minute
      job.status.nextExecution = next
      
    } catch (error) {
      logger.error({ error, jobName: name }, 'Failed to update next execution time')
    }
  }

  /**
   * Gracefully shutdown all cron jobs
   */
  async shutdown(): Promise<void> {
    logger.info('🔄 Shutting down scheduler service...')
    
    this.jobs.forEach((job, name) => {
      try {
        job.task.destroy()
        logger.info(`✅ Destroyed cron job: ${name}`)
      } catch (error) {
        logger.error({ error, jobName: name }, 'Error destroying cron job')
      }
    })
    
    this.jobs.clear()
    logger.info('✅ Scheduler service shutdown complete')
  }
}

// Singleton instance
export const scheduler = new SchedulerService()