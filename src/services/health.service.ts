import { prisma } from '../config/database.js'
import { getRedis } from '../config/redis.js'

export class HealthService {
  async checkHealth() {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      memory: this.checkMemory(),
      uptime: this.getUptime()
    }

    const isHealthy = Object.values(checks).every(check => check.status === 'healthy')

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks
    }
  }

  private async checkDatabase() {
    try {
      await prisma.$queryRaw`SELECT 1`
      return {
        status: 'healthy' as const,
        message: 'Database connection successful',
        responseTime: Date.now()
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async checkRedis() {
    try {
      const redis = getRedis()
      const result = await redis.ping()
      return {
        status: result === 'PONG' ? 'healthy' as const : 'unhealthy' as const,
        message: 'Redis connection successful',
        responseTime: Date.now()
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: 'Redis connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private checkMemory() {
    const memUsage = process.memoryUsage()
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    }

    const isHealthy = memUsageMB.heapUsed < 500 // Alert if heap usage > 500MB

    return {
      status: isHealthy ? 'healthy' as const : 'warning' as const,
      message: isHealthy ? 'Memory usage normal' : 'High memory usage detected',
      memoryUsage: memUsageMB
    }
  }

  private getUptime() {
    const uptimeSeconds = process.uptime()
    const days = Math.floor(uptimeSeconds / 86400)
    const hours = Math.floor((uptimeSeconds % 86400) / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = Math.floor(uptimeSeconds % 60)

    return {
      status: 'healthy' as const,
      message: 'System uptime',
      uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      uptimeSeconds: Math.floor(uptimeSeconds)
    }
  }
}