import type { Session, User } from '@supabase/supabase-js'

export type Role =
  | 'user'
  | 'developer'
  | 'industrialist'
  | 'utilities'
  | 'akimat'
  | 'admin'

export type AuthState = {
  user: User | null
  role: Role | null
  loading: boolean
}

export type AuthResult<T> = {
  data: T | null
  error: Error | null
}

export type AuthSessionData = {
  session: Session | null
  user: User | null
  role: Role | null
}
