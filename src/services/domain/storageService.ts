import { supabase } from '@/services/supabaseClient'
import { logger } from '@/services/logger'
import type { AuthResult } from '@/types/auth'
import { toError } from '@/utils/error'

const AVATAR_BUCKET = 'avatars'
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

function getFileExtension(file: File) {
  const [, extension = 'png'] = file.name.split(/\.(?=[^.]+$)/)
  return extension.toLowerCase()
}

function validateAvatar(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return new Error('Unsupported image format. Use JPG, PNG, WEBP, or GIF.')
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return new Error('Avatar file is too large. Maximum size is 5 MB.')
  }

  return null
}

export const storageService = {
  async uploadAvatar(userId: string, file: File): Promise<AuthResult<string>> {
    const validationError = validateAvatar(file)

    if (validationError) {
      return {
        data: null,
        error: validationError,
      }
    }

    try {
      const extension = getFileExtension(file)
      const path = `${userId}/avatar.${extension}`

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        return {
          data: null,
          error: uploadError,
        }
      }

      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)

      return {
        data: data.publicUrl,
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'storage.uploadAvatar')

      return {
        data: null,
        error: normalizedError,
      }
    }
  },
}
