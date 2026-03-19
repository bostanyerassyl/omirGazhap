import { toError } from '@/utils/error'

export const logger = {
  error(error: unknown, context?: string) {
    if (!import.meta.env.DEV) {
      return
    }

    const normalizedError = toError(error)
    console.error(context ? `[${context}] ${normalizedError.message}` : normalizedError)
  },
}
