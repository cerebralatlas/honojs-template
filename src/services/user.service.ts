import { prisma } from '../config/database.js'
import { hashPassword } from '../utils/auth.js'
import type { CreateUser, UpdateUser } from '../schemas/user.js'

export class UserService {
  async getUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { posts: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ])

    const pages = Math.ceil(total / limit)

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    }
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        posts: {
          select: {
            id: true,
            title: true,
            published: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { posts: true }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  async createUser(userData: CreateUser) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const hashedPassword = await hashPassword(userData.password)

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
  }

  async updateUser(id: string, updates: UpdateUser) {
    const existingUser = await prisma.user.findUnique({ where: { id } })
    
    if (!existingUser) {
      throw new Error('User not found')
    }

    if (updates.email && updates.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updates.email }
      })
      if (emailExists) {
        throw new Error('Email already in use')
      }
    }

    const updateData: any = { ...updates }
    if (updates.password) {
      updateData.password = await hashPassword(updates.password)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
  }

  async deleteUser(id: string) {
    const existingUser = await prisma.user.findUnique({ where: { id } })
    
    if (!existingUser) {
      throw new Error('User not found')
    }

    await prisma.user.delete({ where: { id } })
    
    return { message: 'User deleted successfully' }
  }
}