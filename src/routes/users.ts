import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { userController } from '../controllers/user.js'
import { CreateUserSchema, UpdateUserSchema } from '../schemas/user.js'
import { IdParam, PaginationQuery } from '../schemas/common.js'

const users = new Hono()

users.get('/', zValidator('query', PaginationQuery), userController.getUsers)
users.get('/:id', zValidator('param', IdParam), userController.getUserById)
users.post('/', zValidator('json', CreateUserSchema), userController.createUser)
users.put('/:id', zValidator('param', IdParam), zValidator('json', UpdateUserSchema), userController.updateUser)
users.delete('/:id', zValidator('param', IdParam), userController.deleteUser)

export { users }