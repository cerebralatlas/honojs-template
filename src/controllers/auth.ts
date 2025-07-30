import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from '../config/logger.js'
import { AuthService } from '../services/auth.service.js'
import type { LoginUser, RegisterUser } from '../schemas/auth.js'

const authService = new AuthService()

export const authController = {
  async register(c: Context) {
    try {
      const userData = await c.req.json() as RegisterUser
      
      const result = await authService.register(userData)

      return c.json({
        success: true,
        data: result
      }, 201)
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new HTTPException(409, { message: error.message })
      }
      logger.error({ error }, 'Failed to register user')
      throw new HTTPException(500, { message: 'Failed to register user' })
    }
  },

  async login(c: Context) {
    try {
      const credentials = await c.req.json() as LoginUser
      
      const result = await authService.login(credentials)

      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid email or password') {
        throw new HTTPException(401, { message: error.message })
      }
      logger.error({ error }, 'Failed to login user')
      throw new HTTPException(500, { message: 'Failed to login user' })
    }
  },

  async me(c: Context) {
    try {
      const user = c.get('user')
      
      return c.json({
        success: true,
        data: user
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get current user')
      throw new HTTPException(500, { message: 'Failed to get current user' })
    }
  },

  async meWithRoles(c: Context) {
    try {
      const user = c.get('user')
      const userWithRoles = await authService.getCurrentUserWithRoles(user.id)
      
      return c.json({
        success: true,
        data: userWithRoles
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get current user with roles')
      throw new HTTPException(500, { message: 'Failed to get current user with roles' })
    }
  },

  async refreshToken(c: Context) {
    try {
      const { refreshToken } = await c.req.json()
      
      if (!refreshToken) {
        throw new HTTPException(400, { message: 'Refresh token is required' })
      }

      const result = await authService.refreshToken(refreshToken)
      
      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid or expired')) {
        throw new HTTPException(401, { message: error.message })
      }
      logger.error({ error }, 'Failed to refresh token')
      throw new HTTPException(500, { message: 'Failed to refresh token' })
    }
  },

  async logout(c: Context) {
    try {
      const sessionId = c.get('sessionId')
      const authHeader = c.req.header('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      const result = await authService.logout(sessionId, token)
      
      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error({ error }, 'Failed to logout')
      throw new HTTPException(500, { message: 'Failed to logout' })
    }
  },

  async logoutAll(c: Context) {
    try {
      const user = c.get('user')
      const result = await authService.logoutAll(user.id)
      
      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error({ error }, 'Failed to logout from all devices')
      throw new HTTPException(500, { message: 'Failed to logout from all devices' })
    }
  },

  async getSessions(c: Context) {
    try {
      const user = c.get('user')
      const sessions = await authService.getUserSessions(user.id)
      
      return c.json({
        success: true,
        data: { sessions }
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get user sessions')
      throw new HTTPException(500, { message: 'Failed to get user sessions' })
    }
  },

  async revokeSession(c: Context) {
    try {
      const { sessionId } = c.req.param()
      
      if (!sessionId) {
        throw new HTTPException(400, { message: 'Session ID is required' })
      }

      const result = await authService.revokeSession(sessionId)
      
      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error({ error }, 'Failed to revoke session')
      throw new HTTPException(500, { message: 'Failed to revoke session' })
    }
  }
}