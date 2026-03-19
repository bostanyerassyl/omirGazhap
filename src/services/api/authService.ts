import { supabase } from '../supabaseClient'

export type SignUpPayload = {
  email: string
  password: string
  fullName: string
}

export type SignInPayload = {
  email: string
  password: string
}

export type AuthServiceResult<T> = {
  data: T | null
  error: string | null
}

export const signUp = async ({
  email,
  password,
  fullName,
}: SignUpPayload): Promise<AuthServiceResult<Awaited<ReturnType<typeof supabase.auth.signUp>>['data']>> => {
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
    console.error('Auth error:', error.message)
    return {
      data: null,
      error: error.message,
    }
  }

  return {
    data,
    error: null,
  }
}

export const signIn = async ({
  email,
  password,
}: SignInPayload): Promise<AuthServiceResult<Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']>> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    return {
      data: null,
      error: error.message,
    }
  }

  return {
    data,
    error: null,
  }
}

