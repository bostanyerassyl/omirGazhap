import type { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js'
import type { AuthResult, AuthSessionData, Role } from '@/types/auth'
import { logger } from '@/services/logger'
import { toError } from '@/utils/error'
import { supabase } from '../supabaseClient'

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

function serializeSignUpRole(role: SignUpPayload['role']) {
  if (role === 'user') {
    return 'resident'
  }

  return role
}

function toSessionData(
  session: Session | null,
  userOverride?: User | null,
): AuthSessionData {
  return {
    session,
    user: userOverride ?? session?.user ?? null,
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
          role: serializeSignUpRole(role),
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
      data: toSessionData(data.session, data.user),
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
      data: toSessionData(data.session, data.user),
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

    return {
      data: null,
      error: null,
    }
  } catch (error) {
    return toAuthError<null>(error, 'auth.signOut')
  }
}

export async function updateAuthEmail(email: string): Promise<AuthResult<User>> {
  try {
    const { data, error } = await supabase.auth.updateUser({ email })

    if (error) {
      return {
        data: null,
        error,
      }
    }

    return {
      data: data.user,
      error: null,
    }
  } catch (error) {
    return toAuthError<User>(error, 'auth.updateEmail')
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
      data: toSessionData(data.session, data.session?.user ?? null),
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
    onChange(toSessionData(session, session?.user ?? null), event)
  })

  return subscription
}

