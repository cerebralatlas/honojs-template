import { cors } from 'hono/cors'
import { env } from '../config/env.js'

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true
})