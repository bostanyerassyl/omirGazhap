import type { AuthResult, Role } from '@/types/auth'
import type {
  Profile,
  ProfileCreateInput,
  ProfileDbRole,
  ProfileRecord,
  ProfileUpdateInput,
} from '@/types/profile'
import { logger } from '@/services/logger'
import { toError } from '@/utils/error'
import { supabase } from '../supabaseClient'

function normalizeRole(role: ProfileDbRole | null): Role | null {
  if (role === 'resident') {
    return 'user'
  }

  return role
}

function serializeRole(role: Role | null | undefined): ProfileDbRole | null | undefined {
  if (role === undefined) {
    return undefined
  }

  if (role === null) {
    return null
  }

  if (role === 'user') {
    return 'resident'
  }

  return role
}

function normalizeProfile(record: ProfileRecord): Profile {
  return {
    id: record.id,
    email: record.email ?? '',
    fullName: record.full_name ?? '',
    role: normalizeRole(record.role),
    phone: record.phone ?? '',
    address: record.address ?? '',
    bio: record.bio ?? '',
    avatarUrl: record.avatar_url ?? '',
    companyName: record.company_name ?? '',
    licenseNumber: record.license_number ?? '',
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null,
  }
}

function serializeProfileInput(data: ProfileCreateInput | ProfileUpdateInput) {
  const payload: Partial<ProfileRecord> = {}

  if (data.fullName !== undefined) payload.full_name = data.fullName
  if (data.role !== undefined) payload.role = serializeRole(data.role)
  if (data.phone !== undefined) payload.phone = data.phone
  if (data.address !== undefined) payload.address = data.address
  if (data.bio !== undefined) payload.bio = data.bio
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl
  if (data.companyName !== undefined) payload.company_name = data.companyName
  if (data.licenseNumber !== undefined) payload.license_number = data.licenseNumber

  return payload
}

function toProfileError<T>(error: unknown, context: string): AuthResult<T> {
  const normalizedError = toError(error)
  logger.error(normalizedError, context)

  return {
    data: null,
    error: normalizedError,
  }
}

export async function getProfile(userId: string): Promise<AuthResult<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<ProfileRecord>()

    if (error) {
      return {
        data: null,
        error,
      }
    }

    if (!data) {
      return {
        data: null,
        error: new Error('Profile not found'),
      }
    }

    return {
      data: normalizeProfile(data),
      error: null,
    }
  } catch (error) {
    return toProfileError<Profile>(error, 'profile.get')
  }
}

export async function listProfiles(): Promise<AuthResult<Profile[]>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      .returns<ProfileRecord[]>()

    if (error) {
      return {
        data: null,
        error,
      }
    }

    return {
      data: (data ?? []).map(normalizeProfile),
      error: null,
    }
  } catch (error) {
    return toProfileError<Profile[]>(error, 'profile.list')
  }
}

export async function listProfilesByIds(
  userIds: string[],
): Promise<AuthResult<Record<string, Profile>>> {
  if (userIds.length === 0) {
    return {
      data: {},
      error: null,
    }
  }

  try {
    const uniqueIds = Array.from(new Set(userIds))
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', uniqueIds)
      .returns<ProfileRecord[]>()

    if (error) {
      return {
        data: null,
        error,
      }
    }

    return {
      data: (data ?? []).reduce<Record<string, Profile>>((accumulator, profile) => {
        const normalizedProfile = normalizeProfile(profile)
        accumulator[normalizedProfile.id] = normalizedProfile
        return accumulator
      }, {}),
      error: null,
    }
  } catch (error) {
    return toProfileError<Record<string, Profile>>(error, 'profile.listByIds')
  }
}

export async function countProfiles(): Promise<AuthResult<number>> {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return {
        data: null,
        error,
      }
    }

    return {
      data: count ?? 0,
      error: null,
    }
  } catch (error) {
    return toProfileError<number>(error, 'profile.count')
  }
}

export async function createProfile(
  userId: string,
  initialData: ProfileCreateInput,
): Promise<AuthResult<Profile>> {
  try {
    const payload = {
      id: userId,
      ...(initialData.email !== undefined ? { email: initialData.email } : {}),
      ...serializeProfileInput(initialData),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, {
        onConflict: 'id',
      })
      .select('*')
      .single<ProfileRecord>()

    if (error) {
      return {
        data: null,
        error,
      }
    }

    return {
      data: normalizeProfile(data),
      error: null,
    }
  } catch (error) {
    return toProfileError<Profile>(error, 'profile.create')
  }
}

export async function updateProfile(
  userId: string,
  data: ProfileUpdateInput,
): Promise<AuthResult<Profile>> {
  try {
    const payload = serializeProfileInput(data)

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single<ProfileRecord>()

    if (error) {
      return {
        data: null,
        error,
      }
    }

    return {
      data: normalizeProfile(updatedProfile),
      error: null,
    }
  } catch (error) {
    return toProfileError<Profile>(error, 'profile.update')
  }
}
