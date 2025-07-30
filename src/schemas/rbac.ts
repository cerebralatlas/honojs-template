import { z } from 'zod'

// Role schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name too long'),
  description: z.string().optional()
})

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name too long').optional(),
  description: z.string().optional()
})

export const roleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  permissions: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    resource: z.string(),
    action: z.string(),
    description: z.string().nullable()
  })).optional()
})

// Permission schemas
export const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').max(100, 'Permission name too long'),
  resource: z.string().min(1, 'Resource is required').max(50, 'Resource name too long'),
  action: z.string().min(1, 'Action is required').max(50, 'Action name too long'),
  description: z.string().optional()
})

export const updatePermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').max(100, 'Permission name too long').optional(),
  resource: z.string().min(1, 'Resource is required').max(50, 'Resource name too long').optional(),
  action: z.string().min(1, 'Action is required').max(50, 'Action name too long').optional(),
  description: z.string().optional()
})

export const permissionResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// User role assignment schemas
export const assignRoleSchema = z.object({
  roleId: z.string().uuid('Invalid role ID')
})

export const unassignRoleSchema = z.object({
  roleId: z.string().uuid('Invalid role ID')
})

// Role permission assignment schemas
export const assignPermissionToRoleSchema = z.object({
  permissionId: z.string().uuid('Invalid permission ID')
})

export const unassignPermissionFromRoleSchema = z.object({
  permissionId: z.string().uuid('Invalid permission ID')
})

// Permission check schema
export const checkPermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required')
})

// Query schemas
export const rolesQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional().default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional().default('10'),
  includePermissions: z.string().transform(val => val === 'true').pipe(z.boolean()).optional().default('false')
})

export const permissionsQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive()).optional().default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional().default('10'),
  resource: z.string().optional()
})

// Type exports
export type CreateRoleRequest = z.infer<typeof createRoleSchema>
export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>
export type RoleResponse = z.infer<typeof roleResponseSchema>
export type CreatePermissionRequest = z.infer<typeof createPermissionSchema>
export type UpdatePermissionRequest = z.infer<typeof updatePermissionSchema>
export type PermissionResponse = z.infer<typeof permissionResponseSchema>
export type AssignRoleRequest = z.infer<typeof assignRoleSchema>
export type UnassignRoleRequest = z.infer<typeof unassignRoleSchema>
export type AssignPermissionToRoleRequest = z.infer<typeof assignPermissionToRoleSchema>
export type UnassignPermissionFromRoleRequest = z.infer<typeof unassignPermissionFromRoleSchema>
export type CheckPermissionRequest = z.infer<typeof checkPermissionSchema>
export type RolesQuery = z.infer<typeof rolesQuerySchema>
export type PermissionsQuery = z.infer<typeof permissionsQuerySchema>