import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import request from 'supertest'
import { 
  securityHeaders, 
  ddosProtection, 
  requestSanitizer, 
  csrfProtection,
  applySecurity 
} from '@/middleware/security'

describe('Security Middleware', () => {
  describe('securityHeaders', () => {
    it('should add security headers', async () => {
      const app = new Hono()
      app.use('*', securityHeaders())
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch).get('/')

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block')
      expect(response.headers).toHaveProperty('strict-transport-security')
      expect(response.headers).toHaveProperty('content-security-policy')
      expect(response.headers).toHaveProperty('referrer-policy', 'strict-origin-when-cross-origin')
    })

    it('should allow custom CSP', async () => {
      const app = new Hono()
      const customCSP = "default-src 'self'; script-src 'self' 'unsafe-inline'"
      app.use('*', securityHeaders({ contentSecurityPolicy: customCSP }))
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch).get('/')

      expect(response.headers).toHaveProperty('content-security-policy', customCSP)
    })

    it('should disable headers when set to false', async () => {
      const app = new Hono()
      app.use('*', securityHeaders({ 
        contentSecurityPolicy: false,
        strictTransportSecurity: false 
      }))
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch).get('/')

      expect(response.headers).not.toHaveProperty('content-security-policy')
      expect(response.headers).not.toHaveProperty('strict-transport-security')
    })
  })

  describe('ddosProtection', () => {
    it('should allow normal requests', async () => {
      const app = new Hono()
      app.use('*', ddosProtection)
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .get('/')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')

      expect(response.status).toBe(200)
    })

    it('should block suspicious user agents', async () => {
      const app = new Hono()
      app.use('*', ddosProtection)
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .get('/')
        .set('User-Agent', 'sqlmap/1.0')

      expect(response.status).toBe(403)
      expect(response.headers).toHaveProperty('x-blocked-reason', 'Suspicious User-Agent')
    })

    it('should allow legitimate bots', async () => {
      const app = new Hono()
      app.use('*', ddosProtection)
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .get('/')
        .set('User-Agent', 'Mozilla/5.0 (compatible; Googlebot/2.1)')

      expect(response.status).toBe(200)
    })

    it('should block requests that are too large', async () => {
      const app = new Hono()
      app.use('*', ddosProtection)
      app.post('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .post('/')
        .set('Content-Length', (11 * 1024 * 1024).toString()) // 11MB

      expect(response.status).toBe(413)
      expect(response.headers).toHaveProperty('x-blocked-reason', 'Request too large')
    })
  })

  describe('requestSanitizer', () => {
    it('should allow clean URLs', async () => {
      const app = new Hono()
      app.use('*', requestSanitizer)
      app.get('/clean-url', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .get('/clean-url')
        .set('User-Agent', 'Mozilla/5.0')

      expect(response.status).toBe(200)
    })

    it('should block SQL injection patterns', async () => {
      const app = new Hono()
      app.use('*', requestSanitizer)
      app.get('*', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .get('/search?q=1 UNION SELECT * FROM users')
        .set('User-Agent', 'Mozilla/5.0')

      expect(response.status).toBe(400)
      expect(response.headers).toHaveProperty('x-blocked-reason', 'Malicious URL pattern detected')
    })

    it('should block XSS patterns', async () => {
      const app = new Hono()
      app.use('*', requestSanitizer)
      app.get('*', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .get('/page?content=<script>alert("xss")</script>')
        .set('User-Agent', 'Mozilla/5.0')

      expect(response.status).toBe(400)
      expect(response.headers).toHaveProperty('x-blocked-reason', 'Malicious URL pattern detected')
    })

    it('should block requests without User-Agent', async () => {
      const app = new Hono()
      app.use('*', requestSanitizer)
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch).get('/')

      expect(response.status).toBe(400)
      expect(response.headers).toHaveProperty('x-blocked-reason', 'Missing User-Agent')
    })
  })

  describe('csrfProtection', () => {
    it('should allow GET requests without CSRF checks', async () => {
      const app = new Hono()
      app.use('*', csrfProtection)
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch).get('/')

      expect(response.status).toBe(200)
    })

    it('should allow POST with valid Origin header', async () => {
      const app = new Hono()
      app.use('*', csrfProtection)
      app.post('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .post('/')
        .set('Origin', 'http://localhost:3000')
        .set('Host', 'localhost:3000')

      expect(response.status).toBe(200)
    })

    it('should block POST with invalid Origin header', async () => {
      const app = new Hono()
      app.use('*', csrfProtection)
      app.post('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .post('/')
        .set('Origin', 'http://evil-site.com')
        .set('Host', 'localhost:3000')

      expect(response.status).toBe(403)
      expect(response.headers).toHaveProperty('x-blocked-reason', 'CSRF: Invalid Origin')
    })

    it('should allow POST with valid Referer header when Origin missing', async () => {
      const app = new Hono()
      app.use('*', csrfProtection)
      app.post('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .post('/')
        .set('Referer', 'http://localhost:3000/some-page')
        .set('Host', 'localhost:3000')

      expect(response.status).toBe(200)
    })

    it('should block POST without Origin or Referer', async () => {
      const app = new Hono()
      app.use('*', csrfProtection)
      app.post('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .post('/')
        .set('Host', 'localhost:3000')

      expect(response.status).toBe(403)
      expect(response.headers).toHaveProperty('x-blocked-reason', 'CSRF: Missing Origin/Referer')
    })
  })

  describe('applySecurity', () => {
    it('should apply all security middleware', async () => {
      const app = new Hono()
      
      applySecurity('production').forEach(middleware => {
        app.use('*', middleware)
      })
      
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .get('/')
        .set('User-Agent', 'Mozilla/5.0')

      expect(response.status).toBe(200)
      expect(response.headers).toHaveProperty('x-content-type-options')
      expect(response.headers).toHaveProperty('x-frame-options')
    })

    it('should use development CSP in development mode', async () => {
      const app = new Hono()
      
      applySecurity('development').forEach(middleware => {
        app.use('*', middleware)
      })
      
      app.get('/', (c) => c.text('OK'))

      const response = await request(app.fetch)
        .get('/')
        .set('User-Agent', 'Mozilla/5.0')

      expect(response.headers['content-security-policy']!).toContain('unsafe-inline')
    })
  })
})