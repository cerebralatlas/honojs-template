import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { sseService } from '../services/sse.service.js'
import { logger } from '../config/logger.js'
import { v4 as uuidv4 } from 'uuid'

export const sseController = {
  /**
   * Establish SSE connection
   */
  async connect(c: Context) {
    try {
      const user = c.get('user') // May be undefined for public streams
      const channels = c.req.query('channels')?.split(',') || []
      const clientId = uuidv4()
      
      // Create SSE stream
      const stream = sseService.createConnection(clientId, user?.id, {
        userAgent: c.req.header('user-agent'),
        ip: c.req.header('x-forwarded-for') || 'unknown',
        connectedAt: new Date()
      })
      
      // Subscribe to requested channels
      for (const channel of channels) {
        if (channel.trim()) {
          sseService.subscribe(clientId, channel.trim())
        }
      }
      
      // Set SSE headers
      c.header('Content-Type', 'text/event-stream')
      c.header('Cache-Control', 'no-cache')
      c.header('Connection', 'keep-alive')
      c.header('Access-Control-Allow-Origin', '*')
      c.header('Access-Control-Allow-Headers', 'Cache-Control')
      
      return c.body(stream)
    } catch (error) {
      logger.error({ error }, 'Failed to establish SSE connection')
      throw new HTTPException(500, { message: 'Failed to establish SSE connection' })
    }
  },

  /**
   * Send message to specific channel
   */
  async sendToChannel(c: Context) {
    try {
      const { channel } = c.req.param()
      const body = await c.req.json()
      
      const { event = 'message', data, id } = body
      
      const sentCount = sseService.broadcast(channel, {
        id,
        event,
        data
      })
      
      return c.json({
        success: true,
        data: {
          channel,
          sentCount,
          message: `Sent to ${sentCount} clients`
        }
      })
    } catch (error) {
      logger.error({ error }, 'Failed to send message to channel')
      throw new HTTPException(500, { message: 'Failed to send message to channel' })
    }
  },

  /**
   * Send message to specific user
   */
  async sendToUser(c: Context) {
    try {
      const { userId } = c.req.param()
      const body = await c.req.json()
      
      const { event = 'message', data, id } = body
      
      const sentCount = sseService.sendToUser(userId, {
        id,
        event,
        data
      })
      
      return c.json({
        success: true,
        data: {
          userId,
          sentCount,
          message: `Sent to ${sentCount} client(s)`
        }
      })
    } catch (error) {
      logger.error({ error }, 'Failed to send message to user')
      throw new HTTPException(500, { message: 'Failed to send message to user' })
    }
  },

  /**
   * Broadcast message to all connected clients
   */
  async broadcast(c: Context) {
    try {
      const body = await c.req.json()
      
      const { event = 'broadcast', data, id } = body
      
      const sentCount = sseService.broadcastToAll({
        id,
        event,
        data
      })
      
      return c.json({
        success: true,
        data: {
          sentCount,
          message: `Broadcast to ${sentCount} clients`
        }
      })
    } catch (error) {
      logger.error({ error }, 'Failed to broadcast message')
      throw new HTTPException(500, { message: 'Failed to broadcast message' })
    }
  },

  /**
   * Get SSE service statistics
   */
  async getStats(c: Context) {
    try {
      const stats = sseService.getStats()
      
      return c.json({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get SSE stats')
      throw new HTTPException(500, { message: 'Failed to get SSE stats' })
    }
  },

  /**
   * Get connected clients (admin only)
   */
  async getClients(c: Context) {
    try {
      const clients = sseService.getClients()
      
      return c.json({
        success: true,
        data: clients
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get SSE clients')
      throw new HTTPException(500, { message: 'Failed to get SSE clients' })
    }
  },

  /**
   * Subscribe client to channel
   */
  async subscribe(c: Context) {
    try {
      const { clientId, channel } = c.req.param()
      
      const success = sseService.subscribe(clientId, channel)
      
      if (!success) {
        throw new HTTPException(404, { message: 'Client not found' })
      }
      
      return c.json({
        success: true,
        message: `Client subscribed to channel '${channel}'`
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      
      logger.error({ error }, 'Failed to subscribe client to channel')
      throw new HTTPException(500, { message: 'Failed to subscribe client to channel' })
    }
  },

  /**
   * Unsubscribe client from channel
   */
  async unsubscribe(c: Context) {
    try {
      const { clientId, channel } = c.req.param()
      
      const success = sseService.unsubscribe(clientId, channel)
      
      if (!success) {
        throw new HTTPException(404, { message: 'Client not found' })
      }
      
      return c.json({
        success: true,
        message: `Client unsubscribed from channel '${channel}'`
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      
      logger.error({ error }, 'Failed to unsubscribe client from channel')
      throw new HTTPException(500, { message: 'Failed to unsubscribe client from channel' })
    }
  }
}