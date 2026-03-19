import { z } from 'zod'

export const adminReviewSchema = z.object({
  note: z
    .string()
    .trim()
    .max(500, 'Admin note must be 500 characters or less')
    .optional(),
})
