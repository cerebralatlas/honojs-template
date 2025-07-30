import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { requireRole, requirePermission } from '../middleware/rbac.js'
import { sseController } from '../controllers/sse.js'
import '../types/hono.js'

const sse = new Hono()

// Public SSE connection endpoint (no auth required)
sse.get('/connect', sseController.connect)

// Authenticated SSE connection endpoint
sse.get('/auth/connect', authMiddleware, sseController.connect)

// Admin-only endpoints for managing SSE
sse.use('/admin/*', authMiddleware)
sse.use('/admin/*', requireRole('admin'))

// Send message to channel (admin only)
sse.post('/admin/send/channel/:channel', sseController.sendToChannel)

// Send message to specific user (admin only)
sse.post('/admin/send/user/:userId', sseController.sendToUser)

// Broadcast to all clients (admin only)
sse.post('/admin/broadcast', sseController.broadcast)

// Get SSE statistics (admin only)
sse.get('/admin/stats', sseController.getStats)

// Get connected clients (admin only)
sse.get('/admin/clients', sseController.getClients)

// Subscribe/unsubscribe management (admin only)
sse.post('/admin/clients/:clientId/subscribe/:channel', sseController.subscribe)
sse.delete('/admin/clients/:clientId/subscribe/:channel', sseController.unsubscribe)

// User endpoints (authenticated users can send messages to their own channels)
sse.use('/user/*', authMiddleware)
sse.use('/user/*', requirePermission('sse', 'send'))

// Send message to user's own channel
sse.post('/user/send', async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  
  // Prefix user channel to prevent cross-user messaging
  const userChannel = `user:${user.id}`
  
  const { sseService } = await import('../services/sse.service.js')
  const sentCount = sseService.broadcast(userChannel, {
    event: body.event || 'message',
    data: body.data
  })
  
  return c.json({
    success: true,
    data: {
      channel: userChannel,
      sentCount,
      message: `Sent to ${sentCount} clients`
    }
  })
})

export default sse