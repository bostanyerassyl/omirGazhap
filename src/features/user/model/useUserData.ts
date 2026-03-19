import { useMemo } from 'react'
import { useAuth } from '@/features/auth/model/AuthProvider'
import { getUserProfileData } from '@/services/data/userDataService'

export function useUserData() {
  const { user, role, loading, profile } = useAuth()

  return useMemo(
    () => ({
      user,
      role,
      loading,
      profile: getUserProfileData(profile, role),
      rawProfile: profile,
    }),
    [loading, profile, role, user],
  )
}
