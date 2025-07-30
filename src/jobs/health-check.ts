import { prisma } from '../config/database.js'
import { getRedis } from '../config/redis.js'
import { logger } from '../config/logger.js'

interface HealthMetrics {
  timestamp: Date
  database: {
    connected: boolean
    responseTime: number
  }
  redis: {
    connected: boolean
    responseTime: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  api: {
    uptime: number
    status: 'healthy' | 'warning' | 'error'
  }
}

/**
 * Monitor system health and external dependencies
 */
export async function healthCheck(): Promise<void> {
  const startTime = Date.now()
  
  try {
    const metrics: HealthMetrics = {
      timestamp: new Date(),
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      memory: checkMemoryHealth(),
      api: {
        uptime: process.uptime(),
        status: 'healthy'
      }
    }
    
    // Determine overall health status
    if (!metrics.database.connected || !metrics.redis.connected) {
      metrics.api.status = 'error'
    } else if (metrics.memory.percentage > 90 || 
               metrics.database.responseTime > 5000 || 
               metrics.redis.responseTime > 1000) {
      metrics.api.status = 'warning'
    }
    
    // Store health metrics in Redis
    const redis = getRedis()
    const metricsKey = `health_metrics:${Date.now()}`
    await redis.setex(metricsKey, 24 * 60 * 60, JSON.stringify(metrics)) // Keep for 24 hours
    
    // Keep only last 288 entries (24 hours * 12 checks per hour)
    const allKeys = await redis.keys('health_metrics:*')
    if (allKeys.length > 288) {
      const oldKeys = allKeys
        .sort()
        .slice(0, allKeys.length - 288)
      
      if (oldKeys.length > 0) {
        await redis.del(...oldKeys)
      }
    }
    
    const duration = Date.now() - startTime
    const logLevel = metrics.api.status === 'healthy' ? 'info' : 
                    metrics.api.status === 'warning' ? 'warn' : 'error'
    
    logger[logLevel]({
      ...metrics,
      checkDuration: duration
    }, `💓 Health check completed - Status: ${metrics.api.status}`)
    
    // Alert if critical issues detected
    if (metrics.api.status === 'error') {
      await sendHealthAlert(metrics)
    }
    
  } catch (error) {
    logger.error({ error }, '❌ Health check failed')
    throw error
  }
}

async function checkDatabaseHealth(): Promise<{ connected: boolean; responseTime: number }> {
  const startTime = Date.now()
  
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      connected: true,
      responseTime: Date.now() - startTime
    }
  } catch {
    return {
      connected: false,
      responseTime: Date.now() - startTime
    }
  }
}

async function checkRedisHealth(): Promise<{ connected: boolean; responseTime: number }> {
  const startTime = Date.now()
  
  try {
    const redis = getRedis()
    await redis.ping()
    return {
      connected: true,
      responseTime: Date.now() - startTime
    }
  } catch {
    return {
      connected: false,
      responseTime: Date.now() - startTime
    }
  }
}

function checkMemoryHealth(): { used: number; total: number; percentage: number } {
  const memUsage = process.memoryUsage()
  const used = memUsage.heapUsed
  const total = memUsage.heapTotal
  const percentage = (used / total) * 100
  
  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage: Math.round(percentage * 100) / 100
  }
}

async function sendHealthAlert(metrics: HealthMetrics): Promise<void> {
  // In a real application, you would send alerts via:
  // - Email
  // - Slack webhook
  // - PagerDuty
  // - Discord webhook
  // - SMS service
  // etc.
  
  logger.error({
    metrics,
    alertType: 'CRITICAL_HEALTH_ISSUE'
  }, '🚨 ALERT: Critical health issue detected!')
  
  // Example: You could implement webhook notifications here
  // await sendSlackAlert(metrics)
  // await sendEmailAlert(metrics)
}