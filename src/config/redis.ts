import { Redis } from 'ioredis'
import { env } from './env.js'
import { logger } from './logger.js'

let redis: Redis | null = null

export const createRedisConnection = (): Redis => {
  if (redis) {
    return redis
  }

  try {
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      enableReadyCheck: false,
      maxRetriesPerRequest: null
    })

    redis.on('connect', () => {
      logger.info('Successfully connected to Redis')
    })

    redis.on('error', (err: Error) => {
      logger.error({ error: err }, 'Redis connection error')
    })

    redis.on('ready', () => {
      logger.info('Redis connection is ready')
    })

    redis.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...')
    })

    return redis
  } catch (error) {
    logger.error({ error }, 'Failed to create Redis connection')
    throw error
  }
}

export const getRedis = (): Redis => {
  if (!redis) {
    return createRedisConnection()
  }
  return redis
}

export const closeRedisConnection = async (): Promise<void> => {
  if (redis) {
    await redis.disconnect()
    redis = null
    logger.info('Redis connection closed')
  }
}