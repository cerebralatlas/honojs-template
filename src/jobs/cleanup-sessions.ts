import { getRedis } from '../config/redis.js'
import { logger } from '../config/logger.js'

/**
 * Clean up expired sessions and blacklisted tokens
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const redis = getRedis()
  const startTime = Date.now()
  
  try {
    logger.info('🧹 Starting session cleanup...')
    
    // Get all session keys
    const sessionKeys = await redis.keys('session:*')
    const blacklistKeys = await redis.keys('blacklist:*')
    
    let expiredSessions = 0
    let expiredTokens = 0
    
    // Check session keys for expiration
    for (const key of sessionKeys) {
      const ttl = await redis.ttl(key)
      if (ttl <= 0) {
        await redis.del(key)
        expiredSessions++
      }
    }
    
    // Check blacklisted tokens for expiration
    for (const key of blacklistKeys) {
      const ttl = await redis.ttl(key)
      if (ttl <= 0) {
        await redis.del(key)
        expiredTokens++
      }
    }
    
    const duration = Date.now() - startTime
    
    logger.info({
      expiredSessions,
      expiredTokens,
      totalSessions: sessionKeys.length,
      totalBlacklisted: blacklistKeys.length,
      duration
    }, '✅ Session cleanup completed')
    
  } catch (error) {
    logger.error({ error }, '❌ Session cleanup failed')
    throw error
  }
}