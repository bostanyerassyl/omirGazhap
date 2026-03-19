import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { AuthState, AuthResult, AuthSessionData, Role } from '@/types/auth'
import {
  restoreSession as restoreAuthSession,
  signIn,
  signOut,
  signUp,
  subscribeToAuthChanges,
  type SignInPayload,
  type SignUpPayload,
} from '@/services/api/authService'

type AuthContextValue = AuthState & {
  login: (payload: SignInPayload) => Promise<AuthResult<AuthSessionData>>
  register: (payload: SignUpPayload) => Promise<AuthResult<AuthSessionData>>
  logout: () => Promise<AuthResult<null>>
  restoreSession: () => Promise<AuthResult<AuthSessionData>>
  setRole: (role: Role | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapAuthData(data: AuthSessionData | null): AuthState {
  return {
    user: data?.user ?? null,
    role: data?.role ?? null,
    loading: false,
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  })

  const restoreSession = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }))
    const result = await restoreAuthSession()

    setState({
      ...mapAuthData(result.data),
      loading: false,
    })

    return result
  }, [])

  const login = useCallback(async (payload: SignInPayload) => {
    const result = await signIn(payload)

    if (result.data) {
      setState(mapAuthData(result.data))
    }

    return result
  }, [])

  const register = useCallback(async (payload: SignUpPayload) => {
    const result = await signUp(payload)

    if (result.data?.user) {
      setState(mapAuthData(result.data))
    }

    return result
  }, [])

  const logout = useCallback(async () => {
    const result = await signOut()

    if (!result.error) {
      setState({
        user: null,
        role: null,
        loading: false,
      })
    }

    return result
  }, [])

  const setRole = useCallback((role: Role | null) => {
    setState((current) => ({
      ...current,
      role,
    }))
  }, [])

  useEffect(() => {
    void restoreSession()

    const subscription = subscribeToAuthChanges((data) => {
      setState({
        ...mapAuthData(data),
        loading: false,
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [restoreSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      restoreSession,
      setRole,
    }),
    [login, logout, register, restoreSession, setRole, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
