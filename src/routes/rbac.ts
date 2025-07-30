import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { requirePermission, requireRole } from '../middleware/rbac.js'
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  createPermission,
  getPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
  assignRoleToUser,
  unassignRoleFromUser,
  getUserRoles,
  assignPermissionToRole,
  unassignPermissionFromRole,
  checkUserPermission,
  getUserPermissions,
  getCurrentUserRoles,
  getCurrentUserPermissions
} from '../controllers/rbac.js'

const rbac = new Hono()

// Authentication required for all RBAC endpoints
rbac.use('*', authMiddleware)

// Role management routes (Admin only)
rbac.post('/roles', requireRole('admin'), createRole)
rbac.get('/roles', requirePermission('rbac', 'read'), getRoles)
rbac.get('/roles/:id', requirePermission('rbac', 'read'), getRoleById)
rbac.put('/roles/:id', requireRole('admin'), updateRole)
rbac.delete('/roles/:id', requireRole('admin'), deleteRole)

// Permission management routes (Admin only)
rbac.post('/permissions', requireRole('admin'), createPermission)
rbac.get('/permissions', requirePermission('rbac', 'read'), getPermissions)
rbac.get('/permissions/:id', requirePermission('rbac', 'read'), getPermissionById)
rbac.put('/permissions/:id', requireRole('admin'), updatePermission)
rbac.delete('/permissions/:id', requireRole('admin'), deletePermission)

// User role assignment routes (Admin or user manager)
rbac.post('/users/:userId/roles', requirePermission('users', 'manage'), assignRoleToUser)
rbac.delete('/users/:userId/roles', requirePermission('users', 'manage'), unassignRoleFromUser)
rbac.get('/users/:userId/roles', requirePermission('users', 'read'), getUserRoles)

// Role permission assignment routes (Admin only)
rbac.post('/roles/:roleId/permissions', requireRole('admin'), assignPermissionToRole)
rbac.delete('/roles/:roleId/permissions', requireRole('admin'), unassignPermissionFromRole)

// Permission checking routes
rbac.post('/users/:userId/check-permission', requirePermission('users', 'read'), checkUserPermission)
rbac.get('/users/:userId/permissions', requirePermission('users', 'read'), getUserPermissions)

// Current user RBAC info (any authenticated user can access their own info)
rbac.get('/me/roles', getCurrentUserRoles)
rbac.get('/me/permissions', getCurrentUserPermissions)

export default rbac