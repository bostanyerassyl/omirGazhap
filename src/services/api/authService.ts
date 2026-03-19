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

export const signUp = async ({
  email,
  password,
  fullName,
}: SignUpPayload) => {
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
    return
  }

  return data
}

export const signIn = async ({ email, password }: SignInPayload) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    return
  }

  return data
}

