import type { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js'
import type { AuthResult, AuthSessionData, Role } from '@/types/auth'
import { logger } from '@/services/logger'
import { toError } from '@/utils/error'
import { supabase } from '../supabaseClient'

const AUTH_SNAPSHOT_KEY = 'auth.snapshot'

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

function toSessionData(session: Session | null): AuthSessionData {
  return {
    session,
    user: session?.user ?? null,
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
          role,
        },
      },
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

export function persistAuthSnapshot(user: User | null, role: Role | null) {
  persistSnapshot(user, role)
}

