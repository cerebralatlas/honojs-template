import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { createRedisConnection } from './config/redis.js'
import { loggerMiddleware } from './middleware/logger.js'
import { corsMiddleware } from './middleware/cors.js'
import { errorHandler } from './middleware/error-handler.js'
import { rateLimitMiddleware } from './middleware/rate-limit.js'
import { metricsMiddleware, createMetricsEndpoint } from './middleware/metrics.js'
import { applySecurity } from './middleware/security.js'
import { api } from './routes/index.js'

const app = new Hono()

app.onError(errorHandler)

// Apply security middleware first
const securityEnv = env.NODE_ENV === 'production' ? 'production' : 'development'
applySecurity(securityEnv).forEach(middleware => {
  app.use('*', middleware)
})

app.use('*', corsMiddleware)
app.use('*', metricsMiddleware)
app.use('*', loggerMiddleware)
app.use('*', rateLimitMiddleware)

// Metrics endpoint for Prometheus scraping
if (env.ENABLE_MONITORING) {
  app.get('/metrics', createMetricsEndpoint())
}

app.route(env.API_PREFIX, api)

app.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      message: 'Hono.js Template Server',
      version: '1.0.0',
      environment: env.NODE_ENV,
      docs: `${env.API_PREFIX}/`,
      health: `${env.API_PREFIX}/health`
    }
  })
})

app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: 'Route not found',
      status: 404
    }
  }, 404)
})

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...')
  try {
    // Shutdown scheduler
    const { shutdownJobs } = await import('./jobs/index.js')
    await shutdownJobs()
    
    // Shutdown SSE service
    const { sseService } = await import('./services/sse.service.js')
    await sseService.shutdown()
    
    // Close Redis connection
    const { closeRedisConnection } = await import('./config/redis.js')
    await closeRedisConnection()
    
    logger.info('Application shutdown complete')
    process.exit(0)
  } catch (error) {
    logger.error({ error }, 'Error during shutdown')
    process.exit(1)
  }
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

const startServer = async () => {
  try {
    // Initialize Redis connection
    createRedisConnection()
    
    // Initialize cron jobs
    const { initializeJobs } = await import('./jobs/index.js')
    await initializeJobs()
    
    serve({
      fetch: app.fetch,
      port: env.PORT
    }, (info) => {
      logger.info({
        port: info.port,
        environment: env.NODE_ENV,
        pid: process.pid,
        features: [
          'Dual Token Authentication (Access + Refresh)',
          'JWT Revocation & Session Management', 
          'RBAC Authorization System',
          'Security Headers & Protection',
          'Cron Jobs & Scheduler',
          'Server-Sent Events',
          'Health Monitoring',
          'Rate Limiting',
          'Structured Logging',
          ...(env.ENABLE_MONITORING ? ['Prometheus Metrics'] : [])
        ]
      }, `🚀 Server is running on http://localhost:${info.port}`)
    })
  } catch (error) {
    logger.error({ error }, 'Failed to start server')
    process.exit(1)
  }
}

startServer()
