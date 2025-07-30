import { prisma } from '../config/database.js'
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  AssignRoleRequest,
  UnassignRoleRequest,
  AssignPermissionToRoleRequest,
  UnassignPermissionFromRoleRequest,
  CheckPermissionRequest,
  RolesQuery,
  PermissionsQuery
} from '../schemas/rbac.js'

export class RBACService {
  // Role management
  async createRole(data: CreateRoleRequest) {
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name }
    })

    if (existingRole) {
      throw new Error('Role with this name already exists')
    }

    return await prisma.role.create({
      data: {
        name: data.name,
        description: data.description
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })
  }

  async getRoles(query: RolesQuery) {
    const { page, limit, includePermissions } = query
    const skip = (page - 1) * limit

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        skip,
        take: limit,
        include: includePermissions ? {
          permissions: {
            include: {
              permission: true
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.role.count()
    ])

    return {
      roles: roles.map(role => ({
        ...role,
        permissions: includePermissions && 'permissions' in role && Array.isArray(role.permissions)
          ? role.permissions.map((rp: any) => rp.permission) 
          : undefined
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!role) {
      throw new Error('Role not found')
    }

    return {
      ...role,
      permissions: role.permissions.map((rp: any) => rp.permission)
    }
  }

  async updateRole(id: string, data: UpdateRoleRequest) {
    const existingRole = await prisma.role.findUnique({ where: { id } })
    
    if (!existingRole) {
      throw new Error('Role not found')
    }

    if (data.name && data.name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({
        where: { name: data.name }
      })
      
      if (nameConflict) {
        throw new Error('Role with this name already exists')
      }
    }

    return await prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })
  }

  async deleteRole(id: string) {
    const role = await prisma.role.findUnique({ where: { id } })
    
    if (!role) {
      throw new Error('Role not found')
    }

    await prisma.role.delete({ where: { id } })
    return { message: 'Role deleted successfully' }
  }

  // Permission management
  async createPermission(data: CreatePermissionRequest) {
    const existingPermission = await prisma.permission.findFirst({
      where: {
        AND: [
          { resource: data.resource },
          { action: data.action }
        ]
      }
    })

    if (existingPermission) {
      throw new Error('Permission with this resource and action already exists')
    }

    return await prisma.permission.create({
      data: {
        name: data.name,
        resource: data.resource,
        action: data.action,
        description: data.description
      }
    })
  }

  async getPermissions(query: PermissionsQuery) {
    const { page, limit, resource } = query
    const skip = (page - 1) * limit

    const where = resource ? { resource } : {}

    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.permission.count({ where })
    ])

    return {
      permissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  async getPermissionById(id: string) {
    const permission = await prisma.permission.findUnique({
      where: { id }
    })

    if (!permission) {
      throw new Error('Permission not found')
    }

    return permission
  }

  async updatePermission(id: string, data: UpdatePermissionRequest) {
    const existingPermission = await prisma.permission.findUnique({ where: { id } })
    
    if (!existingPermission) {
      throw new Error('Permission not found')
    }

    if ((data.resource || data.action) && 
        (data.resource !== existingPermission.resource || data.action !== existingPermission.action)) {
      const conflictCheck = await prisma.permission.findFirst({
        where: {
          AND: [
            { resource: data.resource || existingPermission.resource },
            { action: data.action || existingPermission.action }
          ]
        }
      })
      
      if (conflictCheck) {
        throw new Error('Permission with this resource and action already exists')
      }
    }

    return await prisma.permission.update({
      where: { id },
      data
    })
  }

  async deletePermission(id: string) {
    const permission = await prisma.permission.findUnique({ where: { id } })
    
    if (!permission) {
      throw new Error('Permission not found')
    }

    await prisma.permission.delete({ where: { id } })
    return { message: 'Permission deleted successfully' }
  }

  // User role assignment
  async assignRoleToUser(userId: string, data: AssignRoleRequest) {
    const [user, role] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.role.findUnique({ where: { id: data.roleId } })
    ])

    if (!user) {
      throw new Error('User not found')
    }

    if (!role) {
      throw new Error('Role not found')
    }

    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: data.roleId
        }
      }
    })

    if (existingAssignment) {
      throw new Error('User already has this role')
    }

    return await prisma.userRole.create({
      data: {
        userId,
        roleId: data.roleId
      },
      include: {
        role: true
      }
    })
  }

  async unassignRoleFromUser(userId: string, data: UnassignRoleRequest) {
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: data.roleId
        }
      }
    })

    if (!userRole) {
      throw new Error('User does not have this role')
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId: data.roleId
        }
      }
    })

    return { message: 'Role unassigned successfully' }
  }

  async getUserRoles(userId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    return userRoles.map(ur => ({
      ...ur.role,
      permissions: ur.role.permissions.map((rp: any) => rp.permission)
    }))
  }

  // Role permission assignment
  async assignPermissionToRole(roleId: string, data: AssignPermissionToRoleRequest) {
    const [role, permission] = await Promise.all([
      prisma.role.findUnique({ where: { id: roleId } }),
      prisma.permission.findUnique({ where: { id: data.permissionId } })
    ])

    if (!role) {
      throw new Error('Role not found')
    }

    if (!permission) {
      throw new Error('Permission not found')
    }

    const existingAssignment = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: data.permissionId
        }
      }
    })

    if (existingAssignment) {
      throw new Error('Role already has this permission')
    }

    return await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId: data.permissionId
      },
      include: {
        permission: true
      }
    })
  }

  async unassignPermissionFromRole(roleId: string, data: UnassignPermissionFromRoleRequest) {
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: data.permissionId
        }
      }
    })

    if (!rolePermission) {
      throw new Error('Role does not have this permission')
    }

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: data.permissionId
        }
      }
    })

    return { message: 'Permission unassigned successfully' }
  }

  // Permission checking
  async checkUserPermission(userId: string, data: CheckPermissionRequest) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              },
              where: {
                permission: {
                  resource: data.resource,
                  action: data.action
                }
              }
            }
          }
        }
      }
    })

    const hasPermission = userRoles.some(ur => 
      ur.role.permissions.some((rp: any) => 
        rp.permission.resource === data.resource && 
        rp.permission.action === data.action
      )
    )

    return { hasPermission }
  }

  async getUserPermissions(userId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    const permissions = new Map()
    
    userRoles.forEach(ur => {
      ur.role.permissions.forEach((rp: any) => {
        const key = `${rp.permission.resource}:${rp.permission.action}`
        if (!permissions.has(key)) {
          permissions.set(key, rp.permission)
        }
      })
    })

    return Array.from(permissions.values())
  }
}