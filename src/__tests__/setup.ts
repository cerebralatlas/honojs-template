import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import './fixtures/test-env.js'

// Mock external dependencies for testing
vi.mock('@/config/redis', () => ({
  getRedis: vi.fn(() => ({
    setex: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(() => []),
    exists: vi.fn(() => 0),
    flushdb: vi.fn(),
    ping: vi.fn(),
    quit: vi.fn()
  })),
  closeRedisConnection: vi.fn()
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn()
    },
    role: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    permission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    session: {
      deleteMany: vi.fn()
    },
    userRole: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn()
    },
    rolePermission: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn()
    }
  }))
}))

beforeAll(async () => {
  console.log('🧪 Test environment initialized')
})

beforeEach(async () => {
  vi.clearAllMocks()
})

afterEach(async () => {
  // Additional cleanup if needed
})

afterAll(async () => {
  console.log('🧪 Test environment cleaned up')
})

// Test database and Redis instances (mocked)
export const testPrisma = new (await import('@prisma/client')).PrismaClient()
export const testRedis = (await import('../config/redis.js')).getRedis()

// Global test helpers
export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewbHyJ6ZYGxBqQqi', // "password" hashed
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  
  // Mock the user creation
  vi.mocked(testPrisma.user.create).mockResolvedValue(defaultUser)
  vi.mocked(testPrisma.user.findUnique).mockResolvedValue(defaultUser)
  
  return defaultUser
}

export const createTestRole = async (overrides = {}) => {
  const defaultRole = {
    id: 'test-role-id',
    name: 'test_role',
    description: 'Test role for testing',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  
  vi.mocked(testPrisma.role.create).mockResolvedValue(defaultRole)
  vi.mocked(testPrisma.role.findUnique).mockResolvedValue(defaultRole)
  
  return defaultRole
}

export const createTestPermission = async (overrides = {}) => {
  const defaultPermission = {
    id: 'test-permission-id',
    name: 'test_permission',
    description: 'Test permission for testing',
    resource: 'test',
    action: 'read',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
  
  vi.mocked(testPrisma.permission.create).mockResolvedValue(defaultPermission)
  vi.mocked(testPrisma.permission.findUnique).mockResolvedValue(defaultPermission)
  
  return defaultPermission
}