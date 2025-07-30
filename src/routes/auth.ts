import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authController } from '../controllers/auth.js'
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.js'
import { authMiddleware } from '../middleware/auth.js'

const auth = new Hono()

// Public endpoints
auth.post('/register', zValidator('json', registerSchema), authController.register)
auth.post('/login', zValidator('json', loginSchema), authController.login)
auth.post('/refresh', zValidator('json', refreshTokenSchema), authController.refreshToken)

// Protected endpoints
auth.get('/me', authMiddleware, authController.me)
auth.get('/me/with-roles', authMiddleware, authController.meWithRoles)
auth.post('/logout', authMiddleware, authController.logout)
auth.post('/logout-all', authMiddleware, authController.logoutAll)

// Session management
auth.get('/sessions', authMiddleware, authController.getSessions)
auth.delete('/sessions/:sessionId', authMiddleware, authController.revokeSession)

export { auth }