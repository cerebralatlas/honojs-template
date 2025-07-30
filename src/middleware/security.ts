import { createMiddleware } from 'hono/factory'

interface SecurityOptions {
  contentSecurityPolicy?: string | false
  strictTransportSecurity?: string | false
  xContentTypeOptions?: boolean
  xFrameOptions?: string | false
  xXSSProtection?: string | false
  referrerPolicy?: string | false
  permissionsPolicy?: string | false
  crossOriginEmbedderPolicy?: string | false
  crossOriginOpenerPolicy?: string | false
  crossOriginResourcePolicy?: string | false
  originAgentCluster?: boolean
}

const DEFAULT_SECURITY_OPTIONS: Required<SecurityOptions> = {
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self'; frame-ancestors 'none';",
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  xContentTypeOptions: true,
  xFrameOptions: 'DENY',
  xXSSProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), sync-xhr=()',
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'cross-origin',
  originAgentCluster: true
}

export const securityHeaders = (options: SecurityOptions = {}) => {
  const config = { ...DEFAULT_SECURITY_OPTIONS, ...options }

  return createMiddleware(async (c, next) => {
    // Content Security Policy
    if (config.contentSecurityPolicy) {
      c.header('Content-Security-Policy', config.contentSecurityPolicy)
    }

    // HTTP Strict Transport Security (HSTS)
    if (config.strictTransportSecurity) {
      c.header('Strict-Transport-Security', config.strictTransportSecurity)
    }

    // X-Content-Type-Options
    if (config.xContentTypeOptions) {
      c.header('X-Content-Type-Options', 'nosniff')
    }

    // X-Frame-Options
    if (config.xFrameOptions) {
      c.header('X-Frame-Options', config.xFrameOptions)
    }

    // X-XSS-Protection
    if (config.xXSSProtection) {
      c.header('X-XSS-Protection', config.xXSSProtection)
    }

    // Referrer Policy
    if (config.referrerPolicy) {
      c.header('Referrer-Policy', config.referrerPolicy)
    }

    // Permissions Policy (formerly Feature Policy)
    if (config.permissionsPolicy) {
      c.header('Permissions-Policy', config.permissionsPolicy)
    }

    // Cross-Origin Embedder Policy
    if (config.crossOriginEmbedderPolicy) {
      c.header('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy)
    }

    // Cross-Origin Opener Policy
    if (config.crossOriginOpenerPolicy) {
      c.header('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy)
    }

    // Cross-Origin Resource Policy
    if (config.crossOriginResourcePolicy) {
      c.header('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy)
    }

    // Origin-Agent-Cluster
    if (config.originAgentCluster) {
      c.header('Origin-Agent-Cluster', '?1')
    }

    // Additional security headers
    c.header('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
    c.header('X-Powered-By', '') // Remove server identification
    c.header('Server', '') // Remove server identification
    
    await next()
  })
}

// Predefined security configurations for different environments
export const securityConfigs: Record<string, SecurityOptions> = {
  // Development configuration (more relaxed)
  development: {
    contentSecurityPolicy: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: localhost:* ws: wss:; img-src 'self' data: https: localhost:*; font-src 'self' data: https: localhost:*;",
    strictTransportSecurity: false, // Don't enforce HTTPS in development
    xFrameOptions: 'SAMEORIGIN'
  } as SecurityOptions,

  // Production configuration (strict)
  production: {
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none';",
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    xFrameOptions: 'DENY'
  } as SecurityOptions,

  // API-only configuration (minimal CSP)
  api: {
    contentSecurityPolicy: "default-src 'none'; frame-ancestors 'none';",
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    xFrameOptions: 'DENY'
  } as SecurityOptions
}

// Rate limiting protection middleware
export const ddosProtection = createMiddleware(async (c, next) => {
  const userAgent = c.req.header('User-Agent') || ''
  const contentLength = parseInt(c.req.header('Content-Length') || '0')
  
  // Block requests with suspicious characteristics
  const suspiciousPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|python|perl|php/i,
    /sqlmap|nikto|nmap|masscan/i
  ]

  // Allow legitimate bots (search engines, monitoring)
  const legitimateBots = [
    /googlebot|bingbot|slurp|duckduckbot/i,
    /facebookexternalhit|twitterbot|linkedinbot/i,
    /uptimebot|pingdom|newrelic/i
  ]

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent))
  const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent))

  if (isSuspicious && !isLegitimate) {
    c.header('X-Blocked-Reason', 'Suspicious User-Agent')
    return c.text('Forbidden', 403)
  }

  // Block excessively large requests (potential DoS)
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    c.header('X-Blocked-Reason', 'Request too large')
    return c.text('Request Entity Too Large', 413)
  }

  await next()
})

// Request sanitization middleware
export const requestSanitizer = createMiddleware(async (c, next) => {
  const url = c.req.url
  const userAgent = c.req.header('User-Agent') || ''
  
  // Block common attack patterns in URL
  const maliciousPatterns = [
    // SQL Injection patterns
    /union\s+select|drop\s+table|insert\s+into|update\s+set|delete\s+from/i,
    // XSS patterns
    /<script|javascript:|onload=|onerror=/i,
    // Path traversal
    /\.\.\//,
    // Command injection
    /;|\||&|`|\$\(/,
    // LDAP injection
    /\(\|\(/,
    // XXE patterns
    /<!ENTITY|<!DOCTYPE.*ENTITY/i
  ]

  if (maliciousPatterns.some(pattern => pattern.test(url))) {
    c.header('X-Blocked-Reason', 'Malicious URL pattern detected')
    return c.text('Bad Request', 400)
  }

  // Block requests with no User-Agent (often automated)
  if (!userAgent.trim()) {
    c.header('X-Blocked-Reason', 'Missing User-Agent')
    return c.text('Bad Request', 400)
  }

  await next()
})

// IP-based security middleware
export const ipSecurity = createMiddleware(async (c, next) => {
  const clientIP = c.req.header('CF-Connecting-IP') || 
                   c.req.header('X-Forwarded-For') ||
                   c.req.header('X-Real-IP') ||
                   c.req.header('Remote-Addr') ||
                   'unknown'

  // Add IP to request context for logging
  c.set('clientIP', clientIP.split(',')[0].trim())

  // Block private/internal IP ranges if behind reverse proxy
  const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|169\.254\.|::1|fc00::|fe80::)/
  
  if (process.env.NODE_ENV === 'production' && isPrivateIP.test(clientIP)) {
    c.header('X-Blocked-Reason', 'Invalid source IP')
    return c.text('Forbidden', 403)
  }

  await next()
})

// Anti-CSRF middleware for state-changing operations
export const csrfProtection = createMiddleware(async (c, next) => {
  const method = c.req.method.toUpperCase()
  
  // Only apply CSRF protection to state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = c.req.header('Origin')
    const referer = c.req.header('Referer')
    const host = c.req.header('Host')
    
    // Check Origin header first
    if (origin) {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        c.header('X-Blocked-Reason', 'CSRF: Invalid Origin')
        return c.text('Forbidden', 403)
      }
    } else if (referer) {
      // Fallback to Referer header
      const refererHost = new URL(referer).host
      if (refererHost !== host) {
        c.header('X-Blocked-Reason', 'CSRF: Invalid Referer')
        return c.text('Forbidden', 403)
      }
    } else {
      // No Origin or Referer header - potential CSRF
      c.header('X-Blocked-Reason', 'CSRF: Missing Origin/Referer')
      return c.text('Forbidden', 403)
    }
  }

  await next()
})

// Combined security middleware
export const applySecurity = (environment: 'development' | 'production' | 'api' = 'production') => {
  return [
    ipSecurity,
    ddosProtection,
    requestSanitizer,
    securityHeaders(securityConfigs[environment]),
    csrfProtection
  ]
}