import { sseService } from './sse.service.js'
import { logger } from '../config/logger.js'

export interface Notification {
  id?: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  data?: any
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  expiresAt?: Date
}

export class NotificationService {
  /**
   * Send notification to a specific user
   */
  async notifyUser(userId: string, notification: Notification): Promise<boolean> {
    try {
      const message = {
        id: notification.id || `notif_${Date.now()}`,
        event: 'notification',
        data: {
          ...notification,
          timestamp: new Date().toISOString()
        }
      }
      
      const sentCount = sseService.sendToUser(userId, message)
      
      logger.info({
        userId,
        notificationType: notification.type,
        title: notification.title,
        sentCount
      }, '📨 Notification sent to user')
      
      return sentCount > 0
    } catch (error) {
      logger.error({ error, userId, notification }, 'Failed to send notification to user')
      return false
    }
  }

  /**
   * Send notification to all users in a specific channel
   */
  async notifyChannel(channel: string, notification: Notification): Promise<number> {
    try {
      const message = {
        id: notification.id || `notif_${Date.now()}`,
        event: 'notification',
        data: {
          ...notification,
          timestamp: new Date().toISOString()
        }
      }
      
      const sentCount = sseService.broadcast(channel, message)
      
      logger.info({
        channel,
        notificationType: notification.type,
        title: notification.title,
        sentCount
      }, '📨 Notification sent to channel')
      
      return sentCount
    } catch (error) {
      logger.error({ error, channel, notification }, 'Failed to send notification to channel')
      return 0
    }
  }

  /**
   * Send system notification to all users
   */
  async notifyAll(notification: Notification): Promise<number> {
    try {
      const message = {
        id: notification.id || `system_notif_${Date.now()}`,
        event: 'system_notification',
        data: {
          ...notification,
          timestamp: new Date().toISOString()
        }
      }
      
      const sentCount = sseService.broadcastToAll(message)
      
      logger.info({
        notificationType: notification.type,
        title: notification.title,
        sentCount
      }, '📨 System notification sent to all users')
      
      return sentCount
    } catch (error) {
      logger.error({ error, notification }, 'Failed to send system notification')
      return 0
    }
  }

  /**
   * Send real-time update about system status
   */
  async broadcastSystemStatus(status: 'online' | 'maintenance' | 'degraded', message: string, details?: any): Promise<number> {
    return this.notifyAll({
      type: status === 'online' ? 'success' : status === 'maintenance' ? 'warning' : 'error',
      title: 'System Status Update',
      message,
      data: {
        status,
        details,
        timestamp: new Date().toISOString()
      },
      priority: status === 'online' ? 'normal' : 'high'
    })
  }

  /**
   * Send real-time progress updates
   */
  async sendProgressUpdate(userId: string, taskId: string, progress: number, message?: string): Promise<boolean> {
    return this.notifyUser(userId, {
      type: 'info',
      title: 'Task Progress',
      message: message || `Task ${Math.round(progress)}% complete`,
      data: {
        taskId,
        progress,
        type: 'progress'
      },
      priority: 'low'
    })
  }

  /**
   * Send real-time data updates (e.g., dashboard metrics)
   */
  async sendDataUpdate(channel: string, dataType: string, data: any): Promise<number> {
    try {
      const message = {
        id: `data_update_${Date.now()}`,
        event: 'data_update',
        data: {
          type: dataType,
          payload: data,
          timestamp: new Date().toISOString()
        }
      }
      
      const sentCount = sseService.broadcast(channel, message)
      
      logger.debug({
        channel,
        dataType,
        sentCount
      }, '📊 Data update sent')
      
      return sentCount
    } catch (error) {
      logger.error({ error, channel, dataType }, 'Failed to send data update')
      return 0
    }
  }

  /**
   * Send real-time chat message
   */
  async sendChatMessage(channel: string, message: { userId: string; username: string; content: string; timestamp?: Date }): Promise<number> {
    try {
      const sseMessage = {
        id: `chat_${Date.now()}`,
        event: 'chat_message',
        data: {
          ...message,
          timestamp: message.timestamp || new Date()
        }
      }
      
      const sentCount = sseService.broadcast(`chat:${channel}`, sseMessage)
      
      logger.info({
        channel,
        userId: message.userId,
        sentCount
      }, '💬 Chat message sent')
      
      return sentCount
    } catch (error) {
      logger.error({ error, channel, message }, 'Failed to send chat message')
      return 0
    }
  }

  /**
   * Send activity feed update
   */
  async sendActivityUpdate(userId: string, activity: { type: string; description: string; data?: any }): Promise<boolean> {
    return this.notifyUser(userId, {
      type: 'info',
      title: 'Activity Update',
      message: activity.description,
      data: {
        ...activity,
        category: 'activity'
      },
      priority: 'low'
    })
  }
}

// Singleton instance
export const notificationService = new NotificationService()