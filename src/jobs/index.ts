import { scheduler } from '../services/scheduler.service.js'
import { logger } from '../config/logger.js'

// Import individual job modules
import { cleanupExpiredSessions } from './cleanup-sessions.js'
import { generateDailyReport } from './daily-report.js'
import { healthCheck } from './health-check.js'
import { cacheWarmup } from './cache-warmup.js'
import { tokenCleanupJob } from './token-cleanup.js'

/**
 * Initialize and register all cron jobs
 */
export async function initializeJobs(): Promise<void> {
  logger.info('🚀 Initializing cron jobs...')

  try {
    // Register cleanup job - runs every hour
    scheduler.registerJob({
      name: 'cleanup-expired-sessions',
      schedule: '0 * * * *', // Every hour
      task: cleanupExpiredSessions,
      description: 'Clean up expired user sessions and blacklisted tokens',
      enabled: true
    })

    // Register daily report - runs at 6 AM every day
    scheduler.registerJob({
      name: 'daily-report',
      schedule: '0 6 * * *', // 6 AM daily
      task: generateDailyReport,
      description: 'Generate daily system usage report',
      enabled: true
    })

    // Register health check - runs every 5 minutes
    scheduler.registerJob({
      name: 'health-check',
      schedule: '*/5 * * * *', // Every 5 minutes
      task: healthCheck,
      description: 'Monitor system health and external dependencies',
      enabled: true
    })

    // Register cache warmup - runs every 30 minutes
    scheduler.registerJob({
      name: 'cache-warmup',
      schedule: '*/30 * * * *', // Every 30 minutes
      task: cacheWarmup,
      description: 'Warm up frequently accessed cache entries',
      enabled: true
    })

    // Register token cleanup job - runs every 2 hours
    scheduler.registerJob(tokenCleanupJob)

    // Start all jobs
    scheduler.startJob()
    
    logger.info(`✅ Initialized ${scheduler.getJobNames().length} cron jobs`)
    
    // Log job status
    const statuses = scheduler.getJobStatus() as Array<any>
    statuses.forEach(status => {
      logger.info({
        name: status.name,
        schedule: status.schedule,
        enabled: status.enabled,
        description: status.description
      }, 'Registered cron job')
    })

  } catch (error) {
    logger.error({ error }, '❌ Failed to initialize cron jobs')
    throw error
  }
}

/**
 * Gracefully shutdown all jobs
 */
export async function shutdownJobs(): Promise<void> {
  await scheduler.shutdown()
}