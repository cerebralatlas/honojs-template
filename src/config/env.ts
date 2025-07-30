import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_TO_FILE: z.coerce.boolean().default(false),
  JWT_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  HEALTH_CHECK_ENABLED: z.coerce.boolean().default(true),
  
  // Monitoring configuration
  ENABLE_MONITORING: z.coerce.boolean().default(false),
  METRICS_PORT: z.coerce.number().default(9090),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional()
})

const parseEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('Environment validation failed:', error)
    process.exit(1)
  }
}

export const env = parseEnv()
export type Env = z.infer<typeof envSchema>