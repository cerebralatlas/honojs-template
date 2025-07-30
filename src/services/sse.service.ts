import { logger } from '../config/logger.js'

interface SSEClient {
  id: string
  userId?: string
  channels: Set<string>
  controller: ReadableStreamDefaultController
  lastPing: Date
  metadata: Record<string, any>
}

interface SSEMessage {
  id?: string
  event?: string
  data: any
  retry?: number
}

export class SSEService {
  private clients: Map<string, SSEClient> = new Map()
  private channels: Map<string, Set<string>> = new Map() // channel -> client IDs
  private pingInterval: NodeJS.Timeout | null = null
  
  constructor() {
    this.startPingInterval()
    logger.info('📡 SSE Service initialized')
  }

  /**
   * Create a new SSE connection
   */
  createConnection(clientId: string, userId?: string, metadata: Record<string, any> = {}): ReadableStream {
    return new ReadableStream({
      start: (controller) => {
        const client: SSEClient = {
          id: clientId,
          userId,
          channels: new Set(),
          controller,
          lastPing: new Date(),
          metadata
        }
        
        this.clients.set(clientId, client)
        
        // Send initial connection message
        this.sendToClient(clientId, {
          event: 'connected',
          data: {
            clientId,
            timestamp: new Date().toISOString(),
            message: 'Connected to SSE stream'
          }
        })
        
        logger.info({
          clientId,
          userId,
          totalClients: this.clients.size
        }, '📡 New SSE client connected')
      },
      
      cancel: () => {
        this.removeClient(clientId)
      }
    })
  }

  /**
   * Subscribe client to a channel
   */
  subscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId)
    if (!client) {
      logger.warn({ clientId, channel }, 'Attempted to subscribe non-existent client')
      return false
    }
    
    client.channels.add(channel)
    
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)!.add(clientId)
    
    this.sendToClient(clientId, {
      event: 'subscribed',
      data: {
        channel,
        timestamp: new Date().toISOString()
      }
    })
    
    logger.info({ clientId, channel }, '📡 Client subscribed to channel')
    return true
  }

  /**
   * Unsubscribe client from a channel
   */
  unsubscribe(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId)
    if (!client) return false
    
    client.channels.delete(channel)
    
    const channelClients = this.channels.get(channel)
    if (channelClients) {
      channelClients.delete(clientId)
      if (channelClients.size === 0) {
        this.channels.delete(channel)
      }
    }
    
    this.sendToClient(clientId, {
      event: 'unsubscribed',
      data: {
        channel,
        timestamp: new Date().toISOString()
      }
    })
    
    logger.info({ clientId, channel }, '📡 Client unsubscribed from channel')
    return true
  }

  /**
   * Send message to a specific client
   */
  sendToClient(clientId: string, message: SSEMessage): boolean {
    const client = this.clients.get(clientId)
    if (!client) {
      logger.warn({ clientId }, 'Attempted to send message to non-existent client')
      return false
    }
    
    try {
      const formattedMessage = this.formatSSEMessage(message)
      client.controller.enqueue(formattedMessage)
      return true
    } catch (error) {
      logger.error({ error, clientId }, 'Failed to send message to client')
      this.removeClient(clientId)
      return false
    }
  }

  /**
   * Broadcast message to all clients in a channel
   */
  broadcast(channel: string, message: SSEMessage): number {
    const channelClients = this.channels.get(channel)
    if (!channelClients) {
      logger.debug({ channel }, 'No clients in channel for broadcast')
      return 0
    }
    
    let successCount = 0
    
    for (const clientId of channelClients) {
      if (this.sendToClient(clientId, message)) {
        successCount++
      }
    }
    
    logger.info({
      channel,
      messageEvent: message.event,
      totalClients: channelClients.size,
      successCount
    }, '📡 Broadcast message to channel')
    
    return successCount
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(message: SSEMessage): number {
    let successCount = 0
    
    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, message)) {
        successCount++
      }
    }
    
    logger.info({
      messageEvent: message.event,
      totalClients: this.clients.size,
      successCount
    }, '📡 Broadcast message to all clients')
    
    return successCount
  }

  /**
   * Send message to specific user (all their clients)
   */
  sendToUser(userId: string, message: SSEMessage): number {
    let successCount = 0
    
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        if (this.sendToClient(client.id, message)) {
          successCount++
        }
      }
    }
    
    logger.info({
      userId,
      messageEvent: message.event,
      successCount
    }, '📡 Sent message to user')
    
    return successCount
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId)
    if (!client) return
    
    // Remove from all channels
    for (const channel of client.channels) {
      const channelClients = this.channels.get(channel)
      if (channelClients) {
        channelClients.delete(clientId)
        if (channelClients.size === 0) {
          this.channels.delete(channel)
        }
      }
    }
    
    // Close the connection
    try {
      client.controller.close()
    } catch {
      // Connection might already be closed
    }
    
    this.clients.delete(clientId)
    
    logger.info({
      clientId,
      userId: client.userId,
      totalClients: this.clients.size
    }, '📡 SSE client disconnected')
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const channelStats: Record<string, number> = {}
    for (const [channel, clients] of this.channels) {
      channelStats[channel] = clients.size
    }
    
    const userConnections: Record<string, number> = {}
    for (const client of this.clients.values()) {
      if (client.userId) {
        userConnections[client.userId] = (userConnections[client.userId] || 0) + 1
      }
    }
    
    return {
      totalClients: this.clients.size,
      totalChannels: this.channels.size,
      channelStats,
      userConnections: Object.keys(userConnections).length,
      anonymousConnections: this.clients.size - Object.values(userConnections).reduce((a, b) => a + b, 0)
    }
  }

  /**
   * Get list of clients (for admin purposes)
   */
  getClients() {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      userId: client.userId,
      channels: Array.from(client.channels),
      lastPing: client.lastPing,
      metadata: client.metadata
    }))
  }

  /**
   * Format message for SSE protocol
   */
  private formatSSEMessage(message: SSEMessage): string {
    let formatted = ''
    
    if (message.id) {
      formatted += `id: ${message.id}\n`
    }
    
    if (message.event) {
      formatted += `event: ${message.event}\n`
    }
    
    if (message.retry) {
      formatted += `retry: ${message.retry}\n`
    }
    
    const data = typeof message.data === 'string' 
      ? message.data 
      : JSON.stringify(message.data)
    
    // Handle multiline data
    const lines = data.split('\n')
    for (const line of lines) {
      formatted += `data: ${line}\n`
    }
    
    formatted += '\n' // Empty line to mark end of message
    
    return formatted
  }

  /**
   * Start ping interval to keep connections alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = new Date()
      
      for (const client of this.clients.values()) {
        try {
          this.sendToClient(client.id, {
            event: 'ping',
            data: { timestamp: now.toISOString() }
          })
          client.lastPing = now
        } catch {
          // Client will be removed by sendToClient if it fails
        }
      }
    }, 30000) // Ping every 30 seconds
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('🔄 Shutting down SSE service...')
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    
    // Send disconnect message to all clients
    this.broadcastToAll({
      event: 'disconnect',
      data: {
        reason: 'Server shutdown',
        timestamp: new Date().toISOString()
      }
    })
    
    // Close all connections
    for (const clientId of this.clients.keys()) {
      this.removeClient(clientId)
    }
    
    logger.info('✅ SSE service shutdown complete')
  }
}

// Singleton instance
export const sseService = new SSEService()