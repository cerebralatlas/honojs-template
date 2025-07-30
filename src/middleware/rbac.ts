import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { RBACService } from '../services/rbac.service.js'

const rbacService = new RBACService()

export const requirePermission = (resource: string, action: string) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user')
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    try {
      const result = await rbacService.checkUserPermission(user.id, { resource, action })
      
      if (!result.hasPermission) {
        throw new HTTPException(403, { 
          message: `Permission denied: ${action} on ${resource}` 
        })
      }

      await next()
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to check permissions' })
    }
  })
}

export const requireRole = (roleName: string) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user')
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    try {
      const roles = await rbacService.getUserRoles(user.id)
      const hasRole = roles.some(role => role.name === roleName)
      
      if (!hasRole) {
        throw new HTTPException(403, { 
          message: `Role required: ${roleName}` 
        })
      }

      await next()
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to check role' })
    }
  })
}

export const requireAnyRole = (...roleNames: string[]) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user')
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    try {
      const roles = await rbacService.getUserRoles(user.id)
      const hasAnyRole = roles.some(role => roleNames.includes(role.name))
      
      if (!hasAnyRole) {
        throw new HTTPException(403, { 
          message: `One of these roles required: ${roleNames.join(', ')}` 
        })
      }

      await next()
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to check roles' })
    }
  })
}

export const requireAllRoles = (...roleNames: string[]) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user')
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    try {
      const roles = await rbacService.getUserRoles(user.id)
      const userRoleNames = roles.map(role => role.name)
      const hasAllRoles = roleNames.every(roleName => userRoleNames.includes(roleName))
      
      if (!hasAllRoles) {
        throw new HTTPException(403, { 
          message: `All these roles required: ${roleNames.join(', ')}` 
        })
      }

      await next()
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }
      throw new HTTPException(500, { message: 'Failed to check roles' })
    }
  })
}

export const attachUserPermissions = createMiddleware(async (c, next) => {
  const user = c.get('user')
  
  if (user) {
    try {
      const [roles, permissions] = await Promise.all([
        rbacService.getUserRoles(user.id),
        rbacService.getUserPermissions(user.id)
      ])
      
      c.set('userRoles', roles)
      c.set('userPermissions', permissions)
    } catch (error) {
      console.error('Failed to attach user permissions:', error)
    }
  }
  
  await next()
})

export const requirePermissions = createMiddleware(async (c, next) => {
  const user = c.get('user')
  
  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  try {
    const permissions = await rbacService.getUserPermissions(user.id)
    c.set('userPermissions', permissions)
    await next()
  } catch {
    throw new HTTPException(500, { message: 'Failed to load user permissions' })
  }
})

// Helper function to check if user has permission
export const hasPermission = (permissions: unknown[], resource: string, action: string): boolean => {
  return permissions.some((permission: any) => 
    permission.resource === resource && permission.action === action
  )
}

// Helper function to check if user has role  
export const hasRole = (roles: unknown[], roleName: string): boolean => {
  return roles.some((role: any) => role.name === roleName)
}