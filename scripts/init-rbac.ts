#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initRBAC() {
  console.log('🔄 Initializing RBAC system...')

  try {
    // Create basic roles
    const roles = [
      {
        name: 'admin',
        description: 'Administrator with full system access'
      },
      {
        name: 'user',
        description: 'Regular user with basic access'
      },
      {
        name: 'moderator',
        description: 'Moderator with elevated permissions'
      }
    ]

    // Create basic permissions
    const permissions = [
      // RBAC permissions
      { name: 'Read RBAC', resource: 'rbac', action: 'read', description: 'View roles and permissions' },
      { name: 'Manage RBAC', resource: 'rbac', action: 'manage', description: 'Create, update, delete roles and permissions' },
      
      // User management permissions
      { name: 'Read Users', resource: 'users', action: 'read', description: 'View user information' },
      { name: 'Manage Users', resource: 'users', action: 'manage', description: 'Create, update, delete users' },
      { name: 'Read Own Profile', resource: 'users', action: 'read_own', description: 'View own user profile' },
      { name: 'Update Own Profile', resource: 'users', action: 'update_own', description: 'Update own user profile' },
      
      // Post management permissions
      { name: 'Read Posts', resource: 'posts', action: 'read', description: 'View posts' },
      { name: 'Create Posts', resource: 'posts', action: 'create', description: 'Create new posts' },
      { name: 'Update Posts', resource: 'posts', action: 'update', description: 'Update any posts' },
      { name: 'Delete Posts', resource: 'posts', action: 'delete', description: 'Delete any posts' },
      { name: 'Update Own Posts', resource: 'posts', action: 'update_own', description: 'Update own posts' },
      { name: 'Delete Own Posts', resource: 'posts', action: 'delete_own', description: 'Delete own posts' },
      
      // SSE permissions
      { name: 'Send SSE Messages', resource: 'sse', action: 'send', description: 'Send real-time messages via Server-Sent Events' },
      { name: 'Manage SSE', resource: 'sse', action: 'manage', description: 'Full SSE management (admin broadcast, client management)' },
      
      // Scheduler permissions
      { name: 'View Scheduler', resource: 'scheduler', action: 'read', description: 'View cron jobs and their status' },
      { name: 'Manage Scheduler', resource: 'scheduler', action: 'manage', description: 'Start, stop, and trigger cron jobs' }
    ]

    console.log('📝 Creating roles...')
    const createdRoles = []
    for (const role of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: role.name }
      })
      
      if (!existingRole) {
        const createdRole = await prisma.role.create({ data: role })
        createdRoles.push(createdRole)
        console.log(`  ✅ Created role: ${role.name}`)
      } else {
        createdRoles.push(existingRole)
        console.log(`  ℹ️  Role already exists: ${role.name}`)
      }
    }

    console.log('🔑 Creating permissions...')
    const createdPermissions = []
    for (const permission of permissions) {
      const existingPermission = await prisma.permission.findFirst({
        where: {
          AND: [
            { resource: permission.resource },
            { action: permission.action }
          ]
        }
      })
      
      if (!existingPermission) {
        const createdPermission = await prisma.permission.create({ data: permission })
        createdPermissions.push(createdPermission)
        console.log(`  ✅ Created permission: ${permission.name}`)
      } else {
        createdPermissions.push(existingPermission)
        console.log(`  ℹ️  Permission already exists: ${permission.name}`)
      }
    }

    console.log('🔗 Assigning permissions to roles...')
    
    // Admin gets all permissions
    const adminRole = createdRoles.find(r => r.name === 'admin')!
    for (const permission of createdPermissions) {
      const existingAssignment = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        }
      })
      
      if (!existingAssignment) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        })
      }
    }
    console.log(`  ✅ Admin role assigned all permissions`)

    // User gets basic permissions
    const userRole = createdRoles.find(r => r.name === 'user')!
    const userPermissionNames = ['read_own', 'update_own', 'delete_own', 'read', 'create', 'send']
    const userPermissions = createdPermissions.filter(p => 
      userPermissionNames.some(name => p.action.includes(name)) ||
      (p.resource === 'posts' && (p.action === 'read' || p.action === 'create')) ||
      (p.resource === 'sse' && p.action === 'send')
    )
    
    for (const permission of userPermissions) {
      const existingAssignment = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: userRole.id,
            permissionId: permission.id
          }
        }
      })
      
      if (!existingAssignment) {
        await prisma.rolePermission.create({
          data: {
            roleId: userRole.id,
            permissionId: permission.id
          }
        })
      }
    }
    console.log(`  ✅ User role assigned basic permissions`)

    // Moderator gets user management and post moderation permissions
    const moderatorRole = createdRoles.find(r => r.name === 'moderator')!
    const moderatorPermissions = createdPermissions.filter(p =>
      p.resource === 'users' && p.action === 'read' ||
      p.resource === 'posts' ||
      p.resource === 'rbac' && p.action === 'read' ||
      p.resource === 'sse' && p.action === 'send' ||
      p.resource === 'scheduler' && p.action === 'read'
    )
    
    for (const permission of moderatorPermissions) {
      const existingAssignment = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: moderatorRole.id,
            permissionId: permission.id
          }
        }
      })
      
      if (!existingAssignment) {
        await prisma.rolePermission.create({
          data: {
            roleId: moderatorRole.id,
            permissionId: permission.id
          }
        })
      }
    }
    console.log(`  ✅ Moderator role assigned moderation permissions`)

    console.log('')
    console.log('🎉 RBAC system initialized successfully!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`• ${createdRoles.length} roles created/verified`)
    console.log(`• ${createdPermissions.length} permissions created/verified`)
    console.log('• Permission assignments completed')
    console.log('')
    console.log('🔐 Default roles:')
    console.log('• admin: Full system access (includes scheduler and SSE management)')
    console.log('• user: Basic user permissions (read own profile, create/edit own posts, send SSE messages)')
    console.log('• moderator: User management, post moderation, and monitoring access')

  } catch (error) {
    console.error('❌ Failed to initialize RBAC system:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the initialization
initRBAC().catch(console.error)