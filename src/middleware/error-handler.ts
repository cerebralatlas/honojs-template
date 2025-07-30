import { HTTPException } from 'hono/http-exception'
import type { ErrorHandler } from 'hono'
import { logger } from '../config/logger.js'
import { ZodError } from 'zod'

export const errorHandler: ErrorHandler = (err, c) => {
  logger.error({ error: err }, 'Unhandled error occurred')

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          message: err.message,
          status: err.status
        },
        success: false
      },
      err.status
    )
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          message: 'Validation failed',
          details: err.errors,
          status: 400
        },
        success: false
      },
      400
    )
  }

  return c.json(
    {
      error: {
        message: 'Internal Server Error',
        status: 500
      },
      success: false
    },
    500
  )
}