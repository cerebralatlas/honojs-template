// Test environment variables
export const testEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'info',
  JWT_SECRET: 'test-secret-key',
  DATABASE_URL: 'sqlite://./test.db',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  PORT: '3001',
  API_PREFIX: '/api/v1',
  CORS_ORIGIN: 'http://localhost:3001',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  ENABLE_MONITORING: 'false',
  ENABLE_METRICS: 'false',
  ENABLE_TRACING: 'false'
}

// Set test environment variables
for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] = String(value)
}