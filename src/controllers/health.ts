import type { Context } from 'hono'
import { logger } from '../config/logger.js'
import { HealthService } from '../services/health.service.js'

const healthService = new HealthService()

export const healthController = {
  async getHealth(c: Context) {
    try {
      const health = await healthService.checkHealth()
      
      const isHealthy = health.status === 'healthy'
      
      return c.json({
        success: true,
        data: health
      }, isHealthy ? 200 : 503)
    } catch (error) {
      logger.error({ error }, 'Health check failed')
      return c.json({
        success: false,
        error: {
          message: 'Health check failed',
          status: 500
        }
      }, 500)
    }
  },

  async getReadiness(c: Context) {
    try {
      const health = await healthService.checkHealth()
      const isReady = health.checks.database.status === 'healthy' && health.checks.redis.status === 'healthy'

      return c.json({
        success: true,
        data: {
          status: isReady ? 'ready' : 'not ready',
          timestamp: new Date().toISOString(),
          checks: health.checks
        }
      }, isReady ? 200 : 503)
    } catch (error) {
      logger.error({ error }, 'Readiness check failed')
      return c.json({
        success: false,
        error: {
          message: 'Service not ready',
          status: 503
        }
      }, 503)
    }
  },

  async getLiveness(c: Context) {
    return c.json({
      success: true,
      data: {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    })
  }
}