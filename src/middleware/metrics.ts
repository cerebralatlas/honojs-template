import { createMiddleware } from 'hono/factory'
import { metricsService } from '../services/metrics.service.js'
import { env } from '../config/env.js'

export const metricsMiddleware = createMiddleware(async (c, next) => {
  // Skip metrics collection if monitoring is disabled
  if (!env.ENABLE_MONITORING) {
    await next()
    return
  }

  const start = Date.now()
  const method = c.req.method
  const originalUrl = c.req.url
  
  // Extract route pattern (remove query string and base URL)
  const url = new URL(originalUrl)
  let route = url.pathname
  
  // Normalize route patterns to avoid high cardinality
  route = normalizeRoute(route)
  
  // Track active connection
  metricsService.incrementActiveConnections()
  
  try {
    await next()
  } finally {
    // Record metrics after request completion
    const duration = (Date.now() - start) / 1000 // Convert to seconds
    const statusCode = c.res.status
    
    metricsService.recordHttpRequest(method, route, statusCode, duration)
    metricsService.decrementActiveConnections()
  }
})

/**
 * Normalize route patterns to prevent metric cardinality explosion
 */
function normalizeRoute(route: string): string {
  // Remove API prefix for cleaner metrics
  route = route.replace(/^\/api\/v\d+/, '')
  
  // Replace UUIDs with placeholder
  route = route.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
  
  // Replace other IDs (numeric)
  route = route.replace(/\/\d+/g, '/:id')
  
  // Replace user IDs and other common patterns
  route = route.replace(/\/users\/[^/]+/g, '/users/:id')
  route = route.replace(/\/roles\/[^/]+/g, '/roles/:id')
  route = route.replace(/\/permissions\/[^/]+/g, '/permissions/:id')
  
  // Handle scheduler job names
  route = route.replace(/\/scheduler\/jobs\/[^/]+\/trigger/g, '/scheduler/jobs/:name/trigger')
  
  // Handle SSE channels
  route = route.replace(/\/sse\/admin\/send\/channel\/[^/]+/g, '/sse/admin/send/channel/:channel')
  route = route.replace(/\/sse\/admin\/send\/user\/[^/]+/g, '/sse/admin/send/user/:userId')
  
  return route || '/'
}

export const createMetricsEndpoint = () => {
  return createMiddleware(async (c) => {
    // Only allow metrics scraping if monitoring is enabled
    if (!env.ENABLE_MONITORING) {
      return c.json({ error: 'Monitoring is disabled' }, 404)
    }

    try {
      const metrics = await metricsService.getMetrics()
      
      // Set Prometheus-compatible content type
      c.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
      
      return c.text(metrics)
    } catch (error) {
      return c.json({ error: 'Failed to collect metrics' }, 500)
    }
  })
}