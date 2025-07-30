import { createMiddleware } from 'hono/factory'
import { logger } from '../config/logger.js'

export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path
  const userAgent = c.req.header('user-agent') || ''

  logger.info({
    method,
    path,
    userAgent,
    requestId: crypto.randomUUID()
  }, 'Incoming request')

  await next()

  const duration = Date.now() - start
  const status = c.res.status

  logger.info({
    method,
    path,
    status,
    duration: `${duration}ms`
  }, 'Request completed')
})