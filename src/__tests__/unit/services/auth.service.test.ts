import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '@/services/auth.service'
import { createTestUser, testPrisma } from '@tests/setup'

// Mock token service
vi.mock('@/services/token.service', () => ({
  tokenService: {
    generateTokenPair: vi.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt: new Date(),
      refreshTokenExpiresAt: new Date()
    }),
    verifyToken: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllUserTokens: vi.fn(),
    getUserSessions: vi.fn()
  }
}))

// Mock password utilities
vi.mock('@/utils/auth', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  comparePassword: vi.fn()
}))

// Mock metrics
vi.mock('@/services/metrics.service', () => ({
  metricsService: {
    recordUserRegistration: vi.fn(),
    recordUserLogin: vi.fn(),
    recordAuthFailure: vi.fn()
  }
}))

// Mock env
vi.mock('@/config/env', () => ({
  env: {
    ENABLE_MONITORING: false
  }
}))

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const result = await authService.register(userData)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tokens')
      expect(result.user.email).toBe(userData.email)
      expect(result.user.name).toBe(userData.name)
      expect(result.user).not.toHaveProperty('password')
    })

    it('should throw error if user already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      }

      // Create user first
      await createTestUser({ email: userData.email })

      await expect(authService.register(userData))
        .rejects.toThrow('User with this email already exists')
    })
  })

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const { comparePassword } = await import('@/utils/auth')
      vi.mocked(comparePassword).mockResolvedValue(true)

      const user = await createTestUser()
      const credentials = {
        email: user.email,
        password: 'password'
      }

      const result = await authService.login(credentials)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tokens')
      expect(result.user.id).toBe(user.id)
    })

    it('should throw error for invalid credentials', async () => {
      const { comparePassword } = await import('@/utils/auth')
      vi.mocked(comparePassword).mockResolvedValue(false)

      const user = await createTestUser()
      const credentials = {
        email: user.email,
        password: 'wrong-password'
      }

      await expect(authService.login(credentials))
        .rejects.toThrow('Invalid email or password')
    })

    it('should throw error for non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password'
      }

      await expect(authService.login(credentials))
        .rejects.toThrow('Invalid email or password')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user details', async () => {
      const user = await createTestUser()

      const result = await authService.getCurrentUser(user.id)

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })
    })

    it('should throw error if user not found', async () => {
      await expect(authService.getCurrentUser('non-existent-id'))
        .rejects.toThrow('User not found')
    })
  })

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const { tokenService } = await import('@/services/token.service')
      vi.mocked(tokenService.refreshAccessToken).mockResolvedValue({
        accessToken: 'new-access-token',
        accessTokenExpiresAt: new Date()
      })

      const result = await authService.refreshToken('valid-refresh-token')

      expect(result.accessToken).toBe('new-access-token')
      expect(tokenService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token')
    })

    it('should throw error for invalid refresh token', async () => {
      const { tokenService } = await import('@/services/token.service')
      vi.mocked(tokenService.refreshAccessToken).mockResolvedValue(null)

      await expect(authService.refreshToken('invalid-refresh-token'))
        .rejects.toThrow('Invalid or expired refresh token')
    })
  })

  describe('logout', () => {
    it('should revoke session when sessionId provided', async () => {
      const { tokenService } = await import('@/services/token.service')

      const result = await authService.logout('session-123')

      expect(result.message).toBe('Logged out successfully')
      expect(tokenService.revokeSession).toHaveBeenCalledWith('session-123')
    })

    it('should revoke token when token provided', async () => {
      const { tokenService } = await import('@/services/token.service')

      const result = await authService.logout(undefined, 'token-123')

      expect(result.message).toBe('Logged out successfully')
      expect(tokenService.revokeToken).toHaveBeenCalledWith('token-123')
    })
  })

  describe('logoutAll', () => {
    it('should revoke all user tokens', async () => {
      const { tokenService } = await import('@/services/token.service')
      const userId = 'user-123'

      const result = await authService.logoutAll(userId)

      expect(result.message).toBe('Logged out from all devices successfully')
      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith(userId)
    })
  })

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const { tokenService } = await import('@/services/token.service')
      const mockSessions = [
        { sessionId: 'session-1', createdAt: '2024-01-01', lastUsedAt: '2024-01-01' },
        { sessionId: 'session-2', createdAt: '2024-01-02', lastUsedAt: '2024-01-02' }
      ]
      
      vi.mocked(tokenService.getUserSessions).mockResolvedValue(mockSessions)

      const result = await authService.getUserSessions('user-123')

      expect(result).toEqual(mockSessions)
      expect(tokenService.getUserSessions).toHaveBeenCalledWith('user-123')
    })
  })
})