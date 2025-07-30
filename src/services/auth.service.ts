import { prisma } from '../config/database.js'
import { hashPassword, comparePassword } from '../utils/auth.js'
import type { RegisterUser, LoginUser } from '../schemas/auth.js'
import { tokenService, type TokenPair } from './token.service.js'
import { RBACService } from './rbac.service.js'
import { metricsService } from './metrics.service.js'
import { env } from '../config/env.js'

export class AuthService {
  private rbacService = new RBACService()
  async register(userData: RegisterUser): Promise<{ user: any; tokens: TokenPair }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const hashedPassword = await hashPassword(userData.password)
    
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Generate token pair using new token service
    const tokens = await tokenService.generateTokenPair(user.id, user.email)

    // Assign default user role to new users
    await this.assignDefaultRole(user.id)

    // Record metrics
    if (env.ENABLE_MONITORING) {
      metricsService.recordUserRegistration()
    }

    return { user, tokens }
  }

  async login(credentials: LoginUser): Promise<{ user: any; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    })

    if (!user || !(await comparePassword(credentials.password, user.password))) {
      // Record failed login
      if (env.ENABLE_MONITORING) {
        metricsService.recordUserLogin(false)
        metricsService.recordAuthFailure('invalid_credentials')
      }
      throw new Error('Invalid email or password')
    }

    // Generate token pair using new token service
    const tokens = await tokenService.generateTokenPair(user.id, user.email)

    // Record successful login
    if (env.ENABLE_MONITORING) {
      metricsService.recordUserLogin(true)
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      tokens
    }
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  async getCurrentUserWithRoles(userId: string) {
    const user = await this.getCurrentUser(userId)
    const roles = await this.rbacService.getUserRoles(userId)
    const permissions = await this.rbacService.getUserPermissions(userId)

    return {
      ...user,
      roles,
      permissions
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    const result = await tokenService.refreshAccessToken(refreshToken)
    if (!result) {
      throw new Error('Invalid or expired refresh token')
    }
    return result
  }

  /**
   * Logout - revoke current session
   */
  async logout(sessionId?: string, token?: string) {
    if (sessionId) {
      await tokenService.revokeSession(sessionId)
    } else if (token) {
      await tokenService.revokeToken(token)
    }
    
    return { message: 'Logged out successfully' }
  }

  /**
   * Logout from all devices - revoke all user sessions
   */
  async logoutAll(userId: string) {
    await tokenService.revokeAllUserTokens(userId)
    return { message: 'Logged out from all devices successfully' }
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId: string) {
    return await tokenService.getUserSessions(userId)
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string) {
    await tokenService.revokeSession(sessionId)
    return { message: 'Session revoked successfully' }
  }

  /**
   * Verify token using new token service
   */
  async verifyToken(token: string) {
    return await tokenService.verifyToken(token)
  }

  private async assignDefaultRole(userId: string) {
    try {
      // Try to find or create a default "user" role
      let defaultRole = await prisma.role.findUnique({
        where: { name: 'user' }
      })

      if (!defaultRole) {
        defaultRole = await prisma.role.create({
          data: {
            name: 'user',
            description: 'Default user role'
          }
        })
      }

      // Assign the default role to the user
      await this.rbacService.assignRoleToUser(userId, { roleId: defaultRole.id })
    } catch (error) {
      console.error('Failed to assign default role:', error)
    }
  }
}