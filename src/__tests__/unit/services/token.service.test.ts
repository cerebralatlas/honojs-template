import { describe, it, expect, beforeEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { tokenService } from '@/services/token.service'
import { testRedis } from '@tests/setup'

// Mock JWT functions
vi.mock('jsonwebtoken')
const mockJwt = vi.mocked(jwt)

// Mock env
vi.mock('@/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret'
  }
}))

describe('TokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', async () => {
      const userId = '123'
      const email = 'test@example.com'

      mockJwt.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token')

      const result = await tokenService.generateTokenPair(userId, email)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result).toHaveProperty('accessTokenExpiresAt')
      expect(result).toHaveProperty('refreshTokenExpiresAt')
      expect(mockJwt.sign).toHaveBeenCalledTimes(2)
    })

    it('should store refresh token in Redis', async () => {
      const userId = '123'
      const email = 'test@example.com'

      mockJwt.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token')

      await tokenService.generateTokenPair(userId, email)

      // Check if refresh token was stored in Redis
      const keys = await testRedis.keys('refresh:*')
      expect(keys.length).toBe(1)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockPayload = {
        userId: '123',
        email: 'test@example.com',
        sessionId: 'session-123',
        tokenType: 'access' as const,
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      mockJwt.verify.mockReturnValue(mockPayload)

      const result = await tokenService.verifyToken('valid-token')

      expect(result).toEqual(mockPayload)
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'test-secret',
        expect.objectContaining({
          issuer: 'honojs-template',
          audience: 'honojs-template-client'
        })
      )
    })

    it('should return null for blacklisted token', async () => {
      // Add token to blacklist
      await testRedis.setex('blacklist:blacklisted-token', 3600, '1')

      const result = await tokenService.verifyToken('blacklisted-token')

      expect(result).toBeNull()
    })

    it('should return null for expired token', async () => {
      mockJwt.verify.mockImplementation(() => {
        const error = new Error('Token expired')
        error.name = 'TokenExpiredError'
        throw error
      })

      const result = await tokenService.verifyToken('expired-token')

      expect(result).toBeNull()
    })
  })

  describe('revokeToken', () => {
    it('should add token to blacklist', async () => {
      const token = 'token-to-revoke'
      const mockPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      mockJwt.decode.mockReturnValue(mockPayload)

      await tokenService.revokeToken(token)

      const isBlacklisted = await testRedis.exists(`blacklist:${token}`)
      expect(isBlacklisted).toBe(1)
    })
  })

  describe('revokeSession', () => {
    it('should remove session data from Redis', async () => {
      const sessionId = 'test-session'

      // Set up session data
      await testRedis.setex(`refresh:${sessionId}`, 3600, 'refresh-token')
      await testRedis.setex(`token:${sessionId}`, 3600, JSON.stringify({
        userId: '123',
        email: 'test@example.com'
      }))

      await tokenService.revokeSession(sessionId)

      const refreshExists = await testRedis.exists(`refresh:${sessionId}`)
      const sessionExists = await testRedis.exists(`token:${sessionId}`)

      expect(refreshExists).toBe(0)
      expect(sessionExists).toBe(0)
    })
  })

  describe('refreshAccessToken', () => {
    it('should generate new access token for valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token'
      const sessionId = 'session-123'

      // Mock refresh token verification
      const mockPayload = {
        userId: '123',
        email: 'test@example.com',
        sessionId,
        tokenType: 'refresh' as const,
        exp: Math.floor(Date.now() / 1000) + 3600
      }

      mockJwt.verify.mockReturnValue(mockPayload)
      mockJwt.sign.mockReturnValue('new-access-token')

      // Store refresh token in Redis
      await testRedis.setex(`refresh:${sessionId}`, 3600, refreshToken)

      const result = await tokenService.refreshAccessToken(refreshToken)

      expect(result).toHaveProperty('accessToken', 'new-access-token')
      expect(result).toHaveProperty('accessTokenExpiresAt')
    })

    it('should return null for invalid refresh token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = await tokenService.refreshAccessToken('invalid-token')

      expect(result).toBeNull()
    })
  })

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const userId = '123'
      const sessionId1 = 'session-1'
      const sessionId2 = 'session-2'

      // Set up session data
      await testRedis.setex(`token:${sessionId1}`, 3600, JSON.stringify({
        userId,
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      }))

      await testRedis.setex(`token:${sessionId2}`, 3600, JSON.stringify({
        userId: 'different-user',
        email: 'other@example.com',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      }))

      const sessions = await tokenService.getUserSessions(userId)

      expect(sessions).toHaveLength(1)
      expect(sessions[0]).toHaveProperty('sessionId', sessionId1)
      expect(sessions[0]).toHaveProperty('createdAt')
      expect(sessions[0]).toHaveProperty('lastUsedAt')
    })
  })
})