import { getRedis } from '../config/redis.js'
import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'

/**
 * Warm up frequently accessed cache entries
 */
export async function cacheWarmup(): Promise<void> {
  const startTime = Date.now()
  
  try {
    logger.info('🔥 Starting cache warmup...')
    const redis = getRedis()
    
    let warmedEntries = 0
    
    // Warm up user count cache
    const userCount = await prisma.user.count()
    await redis.setex('cache:user_count', 300, userCount.toString()) // 5 minutes TTL
    warmedEntries++
    
    // Warm up published posts count
    const publishedPostsCount = await prisma.post.count({
      where: { published: true }
    })
    await redis.setex('cache:published_posts_count', 300, publishedPostsCount.toString())
    warmedEntries++
    
    // Warm up popular posts (most recent published posts)
    const popularPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    await redis.setex('cache:popular_posts', 600, JSON.stringify(popularPosts)) // 10 minutes TTL
    warmedEntries++
    
    // Warm up active users (users created in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeUsersCount = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })
    await redis.setex('cache:active_users_count', 300, activeUsersCount.toString())
    warmedEntries++
    
    // Warm up system stats
    const systemStats = {
      totalUsers: userCount,
      totalPosts: await prisma.post.count(),
      publishedPosts: publishedPostsCount,
      activeUsers: activeUsersCount,
      lastUpdated: new Date().toISOString()
    }
    await redis.setex('cache:system_stats', 600, JSON.stringify(systemStats))
    warmedEntries++
    
    // Warm up roles for RBAC (if they exist)
    try {
      const roles = await prisma.role.findMany({
        select: {
          id: true,
          name: true,
          description: true
        }
      })
      await redis.setex('cache:roles', 1800, JSON.stringify(roles)) // 30 minutes TTL
      warmedEntries++
    } catch {
      // Roles might not exist in all setups, so we ignore this error
      logger.debug('Roles not found during cache warmup (this is normal if RBAC is not initialized)')
    }
    
    const duration = Date.now() - startTime
    
    logger.info({
      warmedEntries,
      duration,
      cacheKeys: [
        'cache:user_count',
        'cache:published_posts_count',
        'cache:popular_posts',
        'cache:active_users_count',
        'cache:system_stats',
        'cache:roles'
      ]
    }, '✅ Cache warmup completed')
    
    // Optional: Clean up old cache entries
    await cleanupOldCacheEntries(redis)
    
  } catch (error) {
    logger.error({ error }, '❌ Cache warmup failed')
    throw error
  }
}

/**
 * Clean up expired or old cache entries
 */
async function cleanupOldCacheEntries(redis: any): Promise<void> {
  try {
    // Get all cache keys
    const cacheKeys = await redis.keys('cache:*')
    let removedKeys = 0
    
    for (const key of cacheKeys) {
      const ttl = await redis.ttl(key)
      // Remove keys that have already expired (TTL = -2) or have no expiration set (TTL = -1)
      if (ttl === -2) {
        await redis.del(key)
        removedKeys++
      }
    }
    
    if (removedKeys > 0) {
      logger.info({ removedKeys }, '🧹 Cleaned up expired cache entries')
    }
    
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup old cache entries')
  }
}