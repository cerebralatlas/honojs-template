import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { RBACService } from '../services/rbac.service.js'
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  updatePermissionSchema,
  assignRoleSchema,
  unassignRoleSchema,
  assignPermissionToRoleSchema,
  unassignPermissionFromRoleSchema,
  checkPermissionSchema,
  rolesQuerySchema,
  permissionsQuerySchema
} from '../schemas/rbac.js'

const rbacService = new RBACService()

// Role Controllers
export const createRole = async (c: Context) => {
  try {
    const body = await c.req.json()
    const validatedData = createRoleSchema.parse(body)
    
    const role = await rbacService.createRole(validatedData)
    
    return c.json({
      success: true,
      data: role
    }, 201)
  } catch (error) {
    if (error instanceof Error) {
      throw new HTTPException(400, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Internal server error' })
  }
}

export const getRoles = async (c: Context) => {
  try {
    const query = rolesQuerySchema.parse({
      page: c.req.query('page') || '1',
      limit: c.req.query('limit') || '10',
      includePermissions: c.req.query('includePermissions') || 'false'
    })
    
    const result = await rbacService.getRoles(query)
    
    return c.json({
      success: true,
      data: result.roles,
      pagination: result.pagination
    })
  } catch {
    throw new HTTPException(500, { message: 'Failed to fetch roles' })
  }
}

export const getRoleById = async (c: Context) => {
  try {
    const id = c.req.param('id')
    const role = await rbacService.getRoleById(id)
    
    return c.json({
      success: true,
      data: role
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Role not found') {
      throw new HTTPException(404, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to fetch role' })
  }
}

export const updateRole = async (c: Context) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updateRoleSchema.parse(body)
    
    const role = await rbacService.updateRole(id, validatedData)
    
    return c.json({
      success: true,
      data: role
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Role not found') {
        throw new HTTPException(404, { message: error.message })
      }
      throw new HTTPException(400, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to update role' })
  }
}

export const deleteRole = async (c: Context) => {
  try {
    const id = c.req.param('id')
    const result = await rbacService.deleteRole(id)
    
    return c.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Role not found') {
      throw new HTTPException(404, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to delete role' })
  }
}

// Permission Controllers
export const createPermission = async (c: Context) => {
  try {
    const body = await c.req.json()
    const validatedData = createPermissionSchema.parse(body)
    
    const permission = await rbacService.createPermission(validatedData)
    
    return c.json({
      success: true,
      data: permission
    }, 201)
  } catch (error) {
    if (error instanceof Error) {
      throw new HTTPException(400, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Internal server error' })
  }
}

export const getPermissions = async (c: Context) => {
  try {
    const query = permissionsQuerySchema.parse({
      page: c.req.query('page') || '1',
      limit: c.req.query('limit') || '10',
      resource: c.req.query('resource')
    })
    
    const result = await rbacService.getPermissions(query)
    
    return c.json({
      success: true,
      data: result.permissions,
      pagination: result.pagination
    })
  } catch {
    throw new HTTPException(500, { message: 'Failed to fetch permissions' })
  }
}

export const getPermissionById = async (c: Context) => {
  try {
    const id = c.req.param('id')
    const permission = await rbacService.getPermissionById(id)
    
    return c.json({
      success: true,
      data: permission
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Permission not found') {
      throw new HTTPException(404, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to fetch permission' })
  }
}

export const updatePermission = async (c: Context) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updatePermissionSchema.parse(body)
    
    const permission = await rbacService.updatePermission(id, validatedData)
    
    return c.json({
      success: true,
      data: permission
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Permission not found') {
        throw new HTTPException(404, { message: error.message })
      }
      throw new HTTPException(400, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to update permission' })
  }
}

export const deletePermission = async (c: Context) => {
  try {
    const id = c.req.param('id')
    const result = await rbacService.deletePermission(id)
    
    return c.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Permission not found') {
      throw new HTTPException(404, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to delete permission' })
  }
}

// User Role Management Controllers
export const assignRoleToUser = async (c: Context) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const validatedData = assignRoleSchema.parse(body)
    
    const result = await rbacService.assignRoleToUser(userId, validatedData)
    
    return c.json({
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new HTTPException(404, { message: error.message })
      }
      throw new HTTPException(400, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to assign role to user' })
  }
}

export const unassignRoleFromUser = async (c: Context) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const validatedData = unassignRoleSchema.parse(body)
    
    const result = await rbacService.unassignRoleFromUser(userId, validatedData)
    
    return c.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new HTTPException(400, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to unassign role from user' })
  }
}

export const getUserRoles = async (c: Context) => {
  try {
    const userId = c.req.param('userId')
    const roles = await rbacService.getUserRoles(userId)
    
    return c.json({
      success: true,
      data: roles
    })
  } catch {
    throw new HTTPException(500, { message: 'Failed to fetch user roles' })
  }
}

// Role Permission Management Controllers
export const assignPermissionToRole = async (c: Context) => {
  try {
    const roleId = c.req.param('roleId')
    const body = await c.req.json()
    const validatedData = assignPermissionToRoleSchema.parse(body)
    
    const result = await rbacService.assignPermissionToRole(roleId, validatedData)
    
    return c.json({
      success: true,
      data: result
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new HTTPException(404, { message: error.message })
      }
      throw new HTTPException(400, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to assign permission to role' })
  }
}

export const unassignPermissionFromRole = async (c: Context) => {
  try {
    const roleId = c.req.param('roleId')
    const body = await c.req.json()
    const validatedData = unassignPermissionFromRoleSchema.parse(body)
    
    const result = await rbacService.unassignPermissionFromRole(roleId, validatedData)
    
    return c.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    if (error instanceof Error) {
      throw new HTTPException(400, { message: error.message })
    }
    throw new HTTPException(500, { message: 'Failed to unassign permission from role' })
  }
}

// Permission Check Controllers
export const checkUserPermission = async (c: Context) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const validatedData = checkPermissionSchema.parse(body)
    
    const result = await rbacService.checkUserPermission(userId, validatedData)
    
    return c.json({
      success: true,
      data: result
    })
  } catch {
    throw new HTTPException(500, { message: 'Failed to check user permission' })
  }
}

export const getUserPermissions = async (c: Context) => {
  try {
    const userId = c.req.param('userId')
    const permissions = await rbacService.getUserPermissions(userId)
    
    return c.json({
      success: true,
      data: permissions
    })
  } catch {
    throw new HTTPException(500, { message: 'Failed to fetch user permissions' })
  }
}

// Current User RBAC Controllers
export const getCurrentUserRoles = async (c: Context) => {
  try {
    const user = c.get('user')
    const roles = await rbacService.getUserRoles(user.id)
    
    return c.json({
      success: true,
      data: roles
    })
  } catch {
    throw new HTTPException(500, { message: 'Failed to fetch current user roles' })
  }
}

export const getCurrentUserPermissions = async (c: Context) => {
  try {
    const user = c.get('user')
    const permissions = await rbacService.getUserPermissions(user.id)
    
    return c.json({
      success: true,
      data: permissions
    })
  } catch {
    throw new HTTPException(500, { message: 'Failed to fetch current user permissions' })
  }
}