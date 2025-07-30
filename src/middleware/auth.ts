import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { extractTokenFromHeader } from '../utils/auth.js'
import { tokenService } from '../services/token.service.js'
import { prisma } from '../config/database.js'

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    throw new HTTPException(401, { message: 'No token provided' })
  }

  try {
    // Use new token service for verification
    const payload = await tokenService.verifyToken(token)
    
    if (!payload || payload.tokenType !== 'access') {
      throw new HTTPException(401, { message: 'Invalid access token' })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      throw new HTTPException(401, { message: 'User not found' })
    }

    // Set user and session info in context
    c.set('user', user)
    c.set('sessionId', payload.sessionId)
    c.set('tokenPayload', payload)
    
    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }
})