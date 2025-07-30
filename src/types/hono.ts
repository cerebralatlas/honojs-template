import type { User } from '@prisma/client'

declare module 'hono' {
  interface ContextVariableMap {
    user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>
    userRoles?: Array<{
      id: string
      name: string
      description: string | null
    }>
    userPermissions?: Array<{
      id: string
      name: string
      resource: string
      action: string
      description: string | null
    }>
  }
}