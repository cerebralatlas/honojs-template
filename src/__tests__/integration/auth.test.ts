import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import request from 'supertest'
import { auth } from '@/routes/auth'
import { createTestUser } from '@tests/setup'

// Mock the middleware
import { applySecurity } from '@/middleware/security'

const app = new Hono()

// Apply minimal security for testing
const securityMiddleware = applySecurity('development')
securityMiddleware.forEach(middleware => {
  app.use('*', middleware)
})

app.route('/auth', auth)

describe('Authentication API Integration Tests', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'new@example.com',
        password: 'password123'
      }

      const response = await request(app.fetch)
        .post('/auth/register')
        .send(userData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('tokens')
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user).not.toHaveProperty('password')
      expect(response.body.data.tokens).toHaveProperty('accessToken')
      expect(response.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123'
      }

      // Create user first
      await createTestUser({ email: userData.email })

      const response = await request(app.fetch)
        .post('/auth/register')
        .send(userData)

      expect(response.status).toBe(409)
      expect(response.body).toHaveProperty('success', false)
    })

    it('should validate required fields', async () => {
      const response = await request(app.fetch)
        .post('/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123' // too short
        })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const user = await createTestUser()
      
      const response = await request(app.fetch)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'password'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('tokens')
      expect(response.body.data.user.id).toBe(user.id)
    })

    it('should return 401 for invalid credentials', async () => {
      const user = await createTestUser()

      const response = await request(app.fetch)
        .post('/auth/login')
        .send({
          email: user.email,
          password: 'wrong-password'
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('success', false)
    })

    it('should validate email format', async () => {
      const response = await request(app.fetch)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password'
        })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First register a user to get tokens
      const userData = {
        name: 'Test User',
        email: 'refresh@example.com',
        password: 'password123'
      }

      const registerResponse = await request(app.fetch)
        .post('/auth/register')
        .send(userData)

      const { refreshToken } = registerResponse.body.data.tokens

      const response = await request(app.fetch)
        .post('/auth/refresh')
        .send({ refreshToken })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('accessToken')
      expect(response.body.data).toHaveProperty('accessTokenExpiresAt')
    })

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.fetch)
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('success', false)
    })

    it('should require refresh token', async () => {
      const response = await request(app.fetch)
        .post('/auth/refresh')
        .send({})

      expect(response.status).toBe(400)
    })
  })

  describe('Protected Routes', () => {
    let accessToken: string

    beforeEach(async () => {
      // Register a user and get access token
      const userData = {
        name: 'Test User',
        email: 'protected@example.com',
        password: 'password123'
      }

      const response = await request(app.fetch)
        .post('/auth/register')
        .send(userData)

      accessToken = response.body.data.tokens.accessToken
    })

    describe('GET /auth/me', () => {
      it('should return user data for valid token', async () => {
        const response = await request(app.fetch)
          .get('/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.data).toHaveProperty('email', 'protected@example.com')
      })

      it('should return 401 for missing token', async () => {
        const response = await request(app.fetch)
          .get('/auth/me')

        expect(response.status).toBe(401)
      })

      it('should return 401 for invalid token', async () => {
        const response = await request(app.fetch)
          .get('/auth/me')
          .set('Authorization', 'Bearer invalid-token')

        expect(response.status).toBe(401)
      })
    })

    describe('POST /auth/logout', () => {
      it('should logout successfully', async () => {
        const response = await request(app.fetch)
          .post('/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.data.message).toBe('Logged out successfully')
      })
    })

    describe('GET /auth/sessions', () => {
      it('should return user sessions', async () => {
        const response = await request(app.fetch)
          .get('/auth/sessions')
          .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.data).toHaveProperty('sessions')
        expect(Array.isArray(response.body.data.sessions)).toBe(true)
      })
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.fetch)
        .get('/auth/me')

      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
      expect(response.headers).toHaveProperty('x-frame-options')
      expect(response.headers).toHaveProperty('referrer-policy')
    })
  })
})