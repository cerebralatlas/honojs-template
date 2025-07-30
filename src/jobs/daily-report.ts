import { prisma } from '../config/database.js'
import { getRedis } from '../config/redis.js'
import { logger } from '../config/logger.js'

interface DailyStats {
  users: {
    total: number
    newToday: number
    activeToday: number
  }
  posts: {
    total: number
    newToday: number
    published: number
  }
  system: {
    uptime: string
    memoryUsage: NodeJS.MemoryUsage
    redisConnected: boolean
    databaseConnected: boolean
  }
}

/**
 * Generate daily system usage report
 */
export async function generateDailyReport(): Promise<void> {
  const startTime = Date.now()
  
  try {
    logger.info('📊 Generating daily report...')
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Gather statistics
    const stats: DailyStats = {
      users: {
        total: await prisma.user.count(),
        newToday: await prisma.user.count({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        activeToday: 0 // This would require tracking user activity
      },
      posts: {
        total: await prisma.post.count(),
        newToday: await prisma.post.count({
          where: {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        published: await prisma.post.count({
          where: { published: true }
        })
      },
      system: {
        uptime: formatUptime(process.uptime()),
        memoryUsage: process.memoryUsage(),
        redisConnected: await checkRedisConnection(),
        databaseConnected: await checkDatabaseConnection()
      }
    }
    
    // Store report in Redis for later retrieval
    const redis = getRedis()
    const reportKey = `daily_report:${today.toISOString().split('T')[0]}`
    await redis.setex(reportKey, 24 * 60 * 60 * 7, JSON.stringify(stats)) // Keep for 7 days
    
    const duration = Date.now() - startTime
    
    logger.info({
      ...stats,
      reportKey,
      duration
    }, '✅ Daily report generated')
    
    // You could also send this report via email, webhook, etc.
    
  } catch (error) {
    logger.error({ error }, '❌ Daily report generation failed')
    throw error
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

async function checkRedisConnection(): Promise<boolean> {
  try {
    const redis = getRedis()
    await redis.ping()
    return true
  } catch {
    return false
  }
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}