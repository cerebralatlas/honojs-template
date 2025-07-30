import type { Context } from 'hono'
import { logger } from '../config/logger.js'
import { HTTPException } from 'hono/http-exception'
import { UserService } from '../services/user.service.js'
import type { CreateUser, UpdateUser } from '../schemas/user.js'

const userService = new UserService()

export const userController = {
  async getUsers(c: Context) {
    try {
      const page = Number(c.req.query('page')) || 1
      const limit = Number(c.req.query('limit')) || 10

      const result = await userService.getUsers(page, limit)

      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      logger.error({ error }, 'Failed to get users')
      throw new HTTPException(500, { message: 'Failed to fetch users' })
    }
  },

  async getUserById(c: Context) {
    try {
      const id = c.req.param('id')
      
      const user = await userService.getUserById(id)

      return c.json({
        success: true,
        data: user
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw new HTTPException(404, { message: error.message })
      }
      logger.error({ error }, 'Failed to get user by ID')
      throw new HTTPException(500, { message: 'Failed to fetch user' })
    }
  },

  async createUser(c: Context) {
    try {
      const userData = await c.req.json() as CreateUser
      
      const user = await userService.createUser(userData)

      return c.json({
        success: true,
        data: user
      }, 201)
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new HTTPException(409, { message: error.message })
      }
      logger.error({ error }, 'Failed to create user')
      throw new HTTPException(500, { message: 'Failed to create user' })
    }
  },

  async updateUser(c: Context) {
    try {
      const id = c.req.param('id')
      const updates = await c.req.json() as UpdateUser

      const user = await userService.updateUser(id, updates)

      return c.json({
        success: true,
        data: user
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          throw new HTTPException(404, { message: error.message })
        }
        if (error.message === 'Email already in use') {
          throw new HTTPException(409, { message: error.message })
        }
      }
      logger.error({ error }, 'Failed to update user')
      throw new HTTPException(500, { message: 'Failed to update user' })
    }
  },

  async deleteUser(c: Context) {
    try {
      const id = c.req.param('id')

      const result = await userService.deleteUser(id)

      return c.json({
        success: true,
        data: result
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw new HTTPException(404, { message: error.message })
      }
      logger.error({ error }, 'Failed to delete user')
      throw new HTTPException(500, { message: 'Failed to delete user' })
    }
  }
}