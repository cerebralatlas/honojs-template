import { createMiddleware } from 'hono/factory'
import { getRedis } from '../config/redis.js'
import { env } from '../config/env.js'
import { HTTPException } from 'hono/http-exception'

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const redis = getRedis()
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
  const key = `rate_limit:${ip}`

  try {
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, Math.floor(env.RATE_LIMIT_WINDOW_MS / 1000))
    }

    if (current > env.RATE_LIMIT_MAX_REQUESTS) {
      throw new HTTPException(429, { message: 'Too Many Requests' })
    }

    c.header('X-RateLimit-Limit', env.RATE_LIMIT_MAX_REQUESTS.toString())
    c.header('X-RateLimit-Remaining', (env.RATE_LIMIT_MAX_REQUESTS - current).toString())
    
    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    
    await next()
  }
})