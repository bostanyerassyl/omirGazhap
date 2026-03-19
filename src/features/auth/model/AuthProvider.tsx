import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type {
  AuthHydratedSessionData,
  AuthState,
  AuthResult,
  AuthSessionData,
} from '@/types/auth'
import type { ProfileUpdateInput } from '@/types/profile'
import {
  restoreSession as restoreAuthSession,
  signIn,
  signOut,
  signUp,
  subscribeToAuthChanges,
  updateAuthEmail,
  type SignInPayload,
  type SignUpPayload,
} from '@/services/api/authService'
import {
  createProfile,
  getProfile,
  updateProfile as updateProfileData,
} from '@/services/api/profileService'

type AuthContextValue = AuthState & {
  login: (payload: SignInPayload) => Promise<AuthResult<AuthHydratedSessionData>>
  register: (payload: SignUpPayload) => Promise<AuthResult<AuthHydratedSessionData>>
  logout: () => Promise<AuthResult<null>>
  restoreSession: () => Promise<AuthResult<AuthHydratedSessionData>>
  updateProfile: (data: ProfileUpdateInput) => Promise<AuthResult<AuthHydratedSessionData>>
  updateEmail: (email: string) => Promise<AuthResult<AuthHydratedSessionData>>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapAuthData(
  data: AuthHydratedSessionData | null,
): AuthState {
  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    role: data?.profile?.role ?? null,
    loading: false,
  }
}

async function hydrateProfile(
  data: AuthSessionData | null,
  options?: {
    allowCreate?: boolean
    initialProfile?: SignUpPayload
  },
): Promise<AuthResult<AuthHydratedSessionData>> {
  if (!data?.user) {
    return {
      data: data
        ? {
            ...data,
            profile: null,
          }
        : null,
      error: null,
    }
  }

  const profileResult = await getProfile(data.user.id)

  if (!profileResult.error) {
    return {
      data: {
        ...data,
        profile: profileResult.data,
      },
      error: null,
    }
  }

  if (!options?.allowCreate) {
    return {
      data: {
        ...data,
        profile: null,
      },
      error: profileResult.error,
    }
  }

  const createdProfile = await createProfile(data.user.id, {
    email: data.user.email ?? '',
    fullName:
      options.initialProfile?.fullName ??
      (typeof data.user.user_metadata.full_name === 'string'
        ? data.user.user_metadata.full_name
        : ''),
    role: options.initialProfile?.role ?? null,
  })

  if (createdProfile.error) {
    return {
      data: {
        ...data,
        profile: null,
      },
      error: createdProfile.error,
    }
  }

  return {
    data: {
      ...data,
      profile: createdProfile.data,
    },
    error: null,
  }
}

function resolveAuthData(
  result: AuthResult<AuthSessionData>,
): AuthResult<AuthSessionData> {
  if (result.error) {
    return {
      data: null,
      error: result.error,
    }
  }

  if (!result.data) {
    return {
      data: null,
      error: new Error('Authentication did not return session data'),
    }
  }

  return result
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
  })

  const restoreSession = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }))
    const authResult = await restoreAuthSession()
    const resolvedAuthResult = resolveAuthData(authResult)

    if (resolvedAuthResult.error) {
      setState({
        user: null,
        profile: null,
        role: null,
        loading: false,
      })

      return {
        data: null,
        error: resolvedAuthResult.error,
      }
    }

    const result = await hydrateProfile(resolvedAuthResult.data)

    setState({
      ...mapAuthData(result.data),
      loading: false,
    })

    return result
  }, [])

  const login = useCallback(async (payload: SignInPayload) => {
    const authResult = await signIn(payload)
    const resolvedAuthResult = resolveAuthData(authResult)

    if (resolvedAuthResult.error) {
      return {
        data: null,
        error: resolvedAuthResult.error,
      }
    }

    const result = await hydrateProfile(resolvedAuthResult.data)

    if (result.data) {
      setState(mapAuthData(result.data))
    }

    return result
  }, [])

  const register = useCallback(async (payload: SignUpPayload) => {
    const authResult = await signUp(payload)
    const resolvedAuthResult = resolveAuthData(authResult)

    if (resolvedAuthResult.error) {
      return {
        data: null,
        error: resolvedAuthResult.error,
      }
    }

    const result = await hydrateProfile(resolvedAuthResult.data, {
      allowCreate: true,
      initialProfile: payload,
    })

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
        profile: null,
        role: null,
        loading: false,
      })
    }

    return result
  }, [])

  const updateProfile = useCallback(
    async (data: ProfileUpdateInput) => {
      if (!state.user) {
        return {
          data: null,
          error: new Error('User is not authenticated'),
        }
      }

      const result = await updateProfileData(state.user.id, data)

      if (result.error) {
        return {
          data: null,
          error: result.error,
        }
      }

      const nextState = {
        session: null,
        user: state.user,
        profile: result.data,
      }

      setState({
        user: state.user,
        profile: result.data,
        role: result.data?.role ?? null,
        loading: false,
      })

      return {
        data: nextState,
        error: null,
      }
    },
    [state.user],
  )

  const updateEmail = useCallback(
    async (email: string) => {
      if (!state.user) {
        return {
          data: null,
          error: new Error('User is not authenticated'),
        }
      }

      const emailResult = await updateAuthEmail(email)

      if (emailResult.error) {
        return {
          data: null,
          error: emailResult.error,
        }
      }

      const profileResult = await getProfile(state.user.id)
      const nextUser = emailResult.data ?? state.user
      const nextProfile =
        profileResult.error || !profileResult.data
          ? state.profile
          : profileResult.data

      setState({
        user: nextUser,
        profile: nextProfile,
        role: nextProfile?.role ?? null,
        loading: false,
      })

      return {
        data: {
          session: null,
          user: nextUser,
          profile: nextProfile,
        },
        error: null,
      }
    },
    [state.profile, state.user],
  )

  useEffect(() => {
    void restoreSession()

    const subscription = subscribeToAuthChanges((data) => {
      void hydrateProfile(data).then((result) => {
        setState({
          ...mapAuthData(result.data),
          loading: false,
        })
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
      updateProfile,
      updateEmail,
    }),
    [login, logout, register, restoreSession, state, updateEmail, updateProfile],
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
