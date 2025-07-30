import { Hono } from 'hono'
import { healthController } from '../controllers/health.js'

const health = new Hono()

health.get('/health', healthController.getHealth)
health.get('/ready', healthController.getReadiness)
health.get('/live', healthController.getLiveness)

export { health }