import { Hono } from 'hono'
import { health } from './health.js'
import { users } from './users.js'
import { auth } from './auth.js'
import rbac from './rbac.js'
import scheduler from './scheduler.js'
import sse from './sse.js'
import { env } from '../config/env.js'

const api = new Hono()

api.route('/', health)
api.route('/auth', auth)
api.route('/users', users)
api.route('/rbac', rbac)
api.route('/scheduler', scheduler)
api.route('/sse', sse)

api.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      message: 'Hono.js Template API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  })
})

export { api }