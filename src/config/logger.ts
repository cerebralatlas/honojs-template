import { pino } from 'pino'
import { env } from './env.js'

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level(label: any) {
      return { level: label }
    }
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`
})