import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d'
  })
}

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, env.JWT_SECRET)
  } catch {
    throw new Error('Invalid token')
  }
}

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}