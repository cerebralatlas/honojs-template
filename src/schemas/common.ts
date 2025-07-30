import { z } from 'zod'

export const ApiResponse = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      message: z.string(),
      status: z.number(),
      details: z.any().optional()
    }).optional(),
    meta: z.object({
      timestamp: z.string(),
      requestId: z.string().optional()
    }).optional()
  })

export const PaginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
})

export const PaginatedResponse = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean()
    })
  })

export const IdParam = z.object({
  id: z.string().uuid()
})