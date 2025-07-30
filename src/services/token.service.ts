import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { getRedis } from '../config/redis.js'
import { logger } from '../config/logger.js'

export interface TokenPayload {
  userId: string
  email: string
  sessionId: string
  tokenType: 'access' | 'refresh'
  exp?: number
  iat?: number
  iss?: string
  aud?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}

export class TokenService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!
  private readonly ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = '7d' // 7 days
  private readonly REDIS_TOKEN_PREFIX = 'token:'
  private readonly REDIS_BLACKLIST_PREFIX = 'blacklist:'
  private readonly REDIS_REFRESH_PREFIX = 'refresh:'

  /**
   * Generate a pair of access and refresh tokens
   */
  async generateTokenPair(userId: string, email: string): Promise<TokenPair> {
    const sessionId = uuidv4()
    const redis = getRedis()

    // Create token payloads
    const accessPayload: TokenPayload = {
      userId,
      email,
      sessionId,
      tokenType: 'access'
    }

    const refreshPayload: TokenPayload = {
      userId,
      email,
      sessionId,
      tokenType: 'refresh'
    }

    // Generate tokens
    const accessToken = jwt.sign(accessPayload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'honojs-template',
      audience: 'honojs-template-client'
    })

    const refreshToken = jwt.sign(refreshPayload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'honojs-template',
      audience: 'honojs-template-client'
    })

    // Calculate expiration times
    const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store refresh token in Redis with expiration
    await redis.setex(
      `${this.REDIS_REFRESH_PREFIX}${sessionId}`,
      7 * 24 * 60 * 60, // 7 days in seconds
      refreshToken
    )

    // Store session metadata
    await redis.setex(
      `${this.REDIS_TOKEN_PREFIX}${sessionId}`,
      7 * 24 * 60 * 60, // 7 days in seconds
      JSON.stringify({
        userId,
        email,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      })
    )

    logger.info(`Token pair generated for user ${userId}, session ${sessionId}`)

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt
    }
  }

  /**
   * Verify a token and check if it's blacklisted
   */
  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const redis = getRedis()

      // Check if token is blacklisted
      const isBlacklisted = await redis.exists(`${this.REDIS_BLACKLIST_PREFIX}${token}`)
      if (isBlacklisted) {
        logger.warn('Attempted to use blacklisted token')
        return null
      }

      // Verify JWT token
      const payload = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'honojs-template',
        audience: 'honojs-template-client'
      }) as TokenPayload

      // Update last used timestamp for the session
      if (payload.sessionId) {
        await this.updateSessionLastUsed(payload.sessionId)
      }

      return payload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expired during verification')
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid token during verification')
      } else {
        logger.error('Unknown error during token verification:', error)
      }
      return null
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; accessTokenExpiresAt: Date } | null> {
    try {
      const redis = getRedis()

      // Verify refresh token
      const payload = await this.verifyToken(refreshToken)
      if (!payload || payload.tokenType !== 'refresh') {
        return null
      }

      // Check if refresh token exists in Redis
      const storedRefreshToken = await redis.get(`${this.REDIS_REFRESH_PREFIX}${payload.sessionId}`)
      if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        logger.warn(`Invalid refresh token for session ${payload.sessionId}`)
        return null
      }

      // Generate new access token
      const accessPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
        sessionId: payload.sessionId,
        tokenType: 'access'
      }

      const accessToken = jwt.sign(accessPayload, this.JWT_SECRET, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'honojs-template',
        audience: 'honojs-template-client'
      })

      const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000)

      // Update session last used
      await this.updateSessionLastUsed(payload.sessionId)

      logger.info(`Access token refreshed for user ${payload.userId}, session ${payload.sessionId}`)

      return {
        accessToken,
        accessTokenExpiresAt
      }
    } catch (error) {
      logger.error('Error refreshing access token:', error)
      return null
    }
  }

  /**
   * Revoke a specific token (add to blacklist)
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const redis = getRedis()
      const payload = jwt.decode(token) as TokenPayload | null

      if (payload && payload.exp) {
        // Add token to blacklist until it would naturally expire
        const ttl = payload.exp - Math.floor(Date.now() / 1000)
        if (ttl > 0) {
          await redis.setex(`${this.REDIS_BLACKLIST_PREFIX}${token}`, ttl, '1')
          logger.info(`Token revoked and blacklisted for ${ttl} seconds`)
        }
      }
    } catch (error) {
      logger.error('Error revoking token:', error)
      throw error
    }
  }

  /**
   * Revoke all tokens for a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const redis = getRedis()

      // Remove refresh token
      await redis.del(`${this.REDIS_REFRESH_PREFIX}${sessionId}`)
      
      // Remove session metadata
      await redis.del(`${this.REDIS_TOKEN_PREFIX}${sessionId}`)

      logger.info(`Session ${sessionId} revoked`)
    } catch (error) {
      logger.error('Error revoking session:', error)
      throw error
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const redis = getRedis()

      // Find all sessions for the user
      const sessionKeys = await redis.keys(`${this.REDIS_TOKEN_PREFIX}*`)
      
      for (const key of sessionKeys) {
        const sessionData = await redis.get(key)
        if (sessionData) {
          const session = JSON.parse(sessionData)
          if (session.userId === userId) {
            const sessionId = key.replace(this.REDIS_TOKEN_PREFIX, '')
            await this.revokeSession(sessionId)
          }
        }
      }

      logger.info(`All tokens revoked for user ${userId}`)
    } catch (error) {
      logger.error('Error revoking all user tokens:', error)
      throw error
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Array<{ sessionId: string; createdAt: string; lastUsedAt: string }>> {
    try {
      const redis = getRedis()
      const sessions = []

      const sessionKeys = await redis.keys(`${this.REDIS_TOKEN_PREFIX}*`)
      
      for (const key of sessionKeys) {
        const sessionData = await redis.get(key)
        if (sessionData) {
          const session = JSON.parse(sessionData)
          if (session.userId === userId) {
            sessions.push({
              sessionId: key.replace(this.REDIS_TOKEN_PREFIX, ''),
              createdAt: session.createdAt,
              lastUsedAt: session.lastUsedAt
            })
          }
        }
      }

      return sessions
    } catch (error) {
      logger.error('Error getting user sessions:', error)
      return []
    }
  }

  /**
   * Update session last used timestamp
   */
  private async updateSessionLastUsed(sessionId: string): Promise<void> {
    try {
      const redis = getRedis()
      const sessionKey = `${this.REDIS_TOKEN_PREFIX}${sessionId}`
      const sessionData = await redis.get(sessionKey)
      
      if (sessionData) {
        const session = JSON.parse(sessionData)
        session.lastUsedAt = new Date().toISOString()
        
        // Get TTL and reset it
        const ttl = await redis.ttl(sessionKey)
        await redis.setex(sessionKey, ttl > 0 ? ttl : 7 * 24 * 60 * 60, JSON.stringify(session))
      }
    } catch (error) {
      logger.error('Error updating session last used:', error)
    }
  }

  /**
   * Clean up expired tokens (called by scheduled job)
   */
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    try {
      const redis = getRedis()
      let deletedCount = 0

      // Clean blacklisted tokens (Redis TTL handles this automatically)
      // Clean session tokens (Redis TTL handles this automatically) 
      // Clean refresh tokens (Redis TTL handles this automatically)

      // We can also manually check for and clean up orphaned data if needed
      const sessionKeys = await redis.keys(`${this.REDIS_TOKEN_PREFIX}*`)
      
      for (const key of sessionKeys) {
        const ttl = await redis.ttl(key)
        if (ttl === -1) { // Key exists but has no expiration
          await redis.del(key)
          deletedCount++
        }
      }

      logger.info(`Token cleanup completed, deleted ${deletedCount} orphaned tokens`)
      return { deletedCount }
    } catch (error) {
      logger.error('Error during token cleanup:', error)
      return { deletedCount: 0 }
    }
  }
}

// Export singleton instance
export const tokenService = new TokenService()