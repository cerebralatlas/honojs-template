import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { scheduler } from '../services/scheduler.service.js'
import { logger } from '../config/logger.js'

export const schedulerController = {
  /**
   * Get status of all cron jobs or a specific job
   */
  async getJobs(c: Context) {
    try {
      const jobName = c.req.query('name')
      const status = scheduler.getJobStatus(jobName)
      
      return c.json({
        success: true,
        data: status
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get job status')
      throw new HTTPException(500, { message: 'Failed to get job status' })
    }
  },

  /**
   * Start a specific job or all jobs
   */
  async startJob(c: Context) {
    try {
      const jobName = c.req.query('name')
      const result = scheduler.startJob(jobName)
      
      if (!result && jobName) {
        throw new HTTPException(404, { message: `Job '${jobName}' not found` })
      }
      
      return c.json({
        success: true,
        message: jobName ? `Job '${jobName}' started` : 'All jobs started'
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      
      logger.error({ error }, 'Failed to start job(s)')
      throw new HTTPException(500, { message: 'Failed to start job(s)' })
    }
  },

  /**
   * Stop a specific job or all jobs
   */
  async stopJob(c: Context) {
    try {
      const jobName = c.req.query('name')
      const result = scheduler.stopJob(jobName)
      
      if (!result && jobName) {
        throw new HTTPException(404, { message: `Job '${jobName}' not found` })
      }
      
      return c.json({
        success: true,
        message: jobName ? `Job '${jobName}' stopped` : 'All jobs stopped'
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      
      logger.error({ error }, 'Failed to stop job(s)')
      throw new HTTPException(500, { message: 'Failed to stop job(s)' })
    }
  },

  /**
   * Manually trigger a specific job
   */
  async triggerJob(c: Context) {
    try {
      const jobName = c.req.param('name')
      
      if (!jobName) {
        throw new HTTPException(400, { message: 'Job name is required' })
      }
      
      const result = await scheduler.triggerJob(jobName)
      
      if (!result) {
        throw new HTTPException(404, { message: `Job '${jobName}' not found or is already running` })
      }
      
      return c.json({
        success: true,
        message: `Job '${jobName}' triggered successfully`
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      
      logger.error({ error, jobName: c.req.param('name') }, 'Failed to trigger job')
      throw new HTTPException(500, { message: 'Failed to trigger job' })
    }
  },

  /**
   * Get list of all registered job names
   */
  async getJobNames(c: Context) {
    try {
      const names = scheduler.getJobNames()
      
      return c.json({
        success: true,
        data: names
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get job names')
      throw new HTTPException(500, { message: 'Failed to get job names' })
    }
  },

  /**
   * Get system health metrics (if health check job is running)
   */
  async getHealthMetrics(c: Context) {
    try {
      const limit = parseInt(c.req.query('limit') || '24') // Default to last 24 entries
      const { getRedis } = await import('../config/redis.js')
      const redis = getRedis()
      
      // Get health metrics from Redis
      const keys = await redis.keys('health_metrics:*')
      const sortedKeys = keys.sort().slice(-limit)
      
      const metrics = []
      for (const key of sortedKeys) {
        const data = await redis.get(key)
        if (data) {
          try {
            metrics.push(JSON.parse(data))
          } catch {
            // Skip invalid JSON
          }
        }
      }
      
      return c.json({
        success: true,
        data: {
          metrics,
          count: metrics.length,
          latest: metrics[metrics.length - 1] || null
        }
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get health metrics')
      throw new HTTPException(500, { message: 'Failed to get health metrics' })
    }
  },

  /**
   * Get daily reports
   */
  async getDailyReports(c: Context) {
    try {
      const days = parseInt(c.req.query('days') || '7') // Default to last 7 days
      const { getRedis } = await import('../config/redis.js')
      const redis = getRedis()
      
      const reports = []
      const today = new Date()
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split('T')[0]
        const reportKey = `daily_report:${dateKey}`
        
        const data = await redis.get(reportKey)
        if (data) {
          try {
            const report = JSON.parse(data)
            reports.push({
              date: dateKey,
              ...report
            })
          } catch {
            // Skip invalid JSON
          }
        }
      }
      
      return c.json({
        success: true,
        data: {
          reports: reports.reverse(), // Most recent first
          count: reports.length
        }
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get daily reports')
      throw new HTTPException(500, { message: 'Failed to get daily reports' })
    }
  }
}