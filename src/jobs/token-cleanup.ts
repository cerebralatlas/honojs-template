import { logger } from '../config/logger.js'
import { tokenService } from '../services/token.service.js'
import type { CronJobConfig, CronJobContext, CronJobStatus } from '../services/scheduler.service.js'

export const tokenCleanupJob: CronJobConfig = {
  name: 'token-cleanup',
  description: 'Clean up expired tokens and orphaned session data',
  schedule: '0 */2 * * *', // Every 2 hours
  timezone: 'UTC',
  enabled: true,

  async execute(context: CronJobContext): Promise<CronJobStatus> {
    const startTime = Date.now()
    logger.info('Starting token cleanup job')

    try {
      // Clean up expired tokens using token service
      const result = await tokenService.cleanupExpiredTokens()

      const duration = Date.now() - startTime
      
      logger.info({
        deletedCount: result.deletedCount,
        duration
      }, 'Token cleanup completed successfully')

      return {
        success: true,
        message: `Cleaned up ${result.deletedCount} expired tokens`,
        duration,
        metadata: {
          deletedCount: result.deletedCount,
          executedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.error({
        error,
        duration
      }, 'Token cleanup job failed')

      return {
        success: false,
        message: `Token cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          executedAt: new Date().toISOString()
        }
      }
    }
  }
}