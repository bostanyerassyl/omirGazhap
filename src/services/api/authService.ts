import type {
  AuthChangeEvent,
  Session,
  Subscription,
  User,
} from '@supabase/supabase-js'
import type { AuthResult, AuthSessionData, Role } from '@/types/auth'
import { logger } from '@/services/logger'
import { toError } from '@/utils/error'
import { supabase } from '../supabaseClient'

const AUTH_SNAPSHOT_KEY = 'auth.snapshot'
const USER_ROLE_MAP_KEY = 'auth.role-map'

export type SignUpPayload = {
  email: string
  password: string
  fullName: string
  role: Extract<Role, 'user' | 'developer' | 'industrialist' | 'utilities'>
}

export type SignInPayload = {
  email: string
  password: string
}

function canUseStorage() {
  return typeof window !== 'undefined'
}

function readRoleMap(): Record<string, Role> {
  if (!canUseStorage()) {
    return {}
  }

  const storedValue = window.localStorage.getItem(USER_ROLE_MAP_KEY)

  if (!storedValue) {
    return {}
  }

  try {
    return JSON.parse(storedValue) as Record<string, Role>
  } catch {
    return {}
  }
}

function writeRoleMap(roleMap: Record<string, Role>) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(USER_ROLE_MAP_KEY, JSON.stringify(roleMap))
}

function persistRole(user: User, role: Role) {
  const roleMap = readRoleMap()
  roleMap[user.id] = role

  if (user.email) {
    roleMap[user.email.toLowerCase()] = role
  }

  writeRoleMap(roleMap)
}

function persistSnapshot(user: User | null, role: Role | null) {
  if (!canUseStorage()) {
    return
  }

  if (!user || !role) {
    window.localStorage.removeItem(AUTH_SNAPSHOT_KEY)
    return
  }

  window.localStorage.setItem(
    AUTH_SNAPSHOT_KEY,
    JSON.stringify({
      userId: user.id,
      role,
    }),
  )
}

function getFallbackSnapshotRole(user: User | null): Role | null {
  if (!canUseStorage() || !user) {
    return null
  }

  const storedValue = window.localStorage.getItem(AUTH_SNAPSHOT_KEY)

  if (!storedValue) {
    return null
  }

  try {
    const snapshot = JSON.parse(storedValue) as { userId?: string; role?: Role }

    return snapshot.userId === user.id ? snapshot.role ?? null : null
  } catch {
    return null
  }
}

function resolveRole(user: User | null, fallbackRole?: Role | null): Role | null {
  if (!user) {
    return fallbackRole ?? null
  }

  const metadataRole =
    typeof user.user_metadata.role === 'string' ? user.user_metadata.role : null

  if (
    metadataRole === 'user' ||
    metadataRole === 'developer' ||
    metadataRole === 'industrialist' ||
    metadataRole === 'utilities' ||
    metadataRole === 'akimat' ||
    metadataRole === 'admin'
  ) {
    return metadataRole
  }

  const roleMap = readRoleMap()

  if (roleMap[user.id]) {
    return roleMap[user.id]
  }

  if (user.email && roleMap[user.email.toLowerCase()]) {
    return roleMap[user.email.toLowerCase()]
  }

  return fallbackRole ?? null
}

function toSessionData(session: Session | null, fallbackRole?: Role | null): AuthSessionData {
  const user = session?.user ?? null
  const role = resolveRole(user, fallbackRole ?? getFallbackSnapshotRole(user))

  if (user && role) {
    persistRole(user, role)
    persistSnapshot(user, role)
  }

  return {
    session,
    user,
    role,
  }
}

function toAuthError<T>(error: unknown, context: string): AuthResult<T> {
  const normalizedError = toError(error)
  logger.error(normalizedError, context)

  return {
    data: null,
    error: normalizedError,
  }
}

export async function signUp({
  email,
  password,
  fullName,
  role,
}: SignUpPayload): Promise<AuthResult<AuthSessionData>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return {
        data: null,
        error,
      }
    }

    if (data.user) {
      persistRole(data.user, role)
    }

    return {
      data: toSessionData(data.session, role),
      error: null,
    }
  } catch (error) {
    return toAuthError<AuthSessionData>(error, 'auth.signUp')
  }
}

export async function signIn({
  email,
  password,
}: SignInPayload): Promise<AuthResult<AuthSessionData>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        data: null,
        error,
      }
    }

    return {
      data: toSessionData(data.session),
      error: null,
    }
  } catch (error) {
    return toAuthError<AuthSessionData>(error, 'auth.signIn')
  }
}

export async function signOut(): Promise<AuthResult<null>> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        data: null,
        error,
      }
    }

    persistSnapshot(null, null)

    return {
      data: null,
      error: null,
    }
  } catch (error) {
    return toAuthError<null>(error, 'auth.signOut')
  }
}

export async function restoreSession(): Promise<AuthResult<AuthSessionData>> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return {
        data: null,
        error,
      }
    }

    return {
      data: toSessionData(data.session),
      error: null,
    }
  } catch (error) {
    return toAuthError<AuthSessionData>(error, 'auth.restoreSession')
  }
}

export function subscribeToAuthChanges(
  onChange: (data: AuthSessionData, event: AuthChangeEvent) => void,
): Subscription {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    onChange(toSessionData(session), event)
  })

  return subscription
}

