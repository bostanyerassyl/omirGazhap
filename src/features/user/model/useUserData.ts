import { useMemo } from 'react'
import { useAuth } from '@/features/auth/model/AuthProvider'
import { getUserProfileData } from '@/services/data/userDataService'

export function useUserData() {
  const { user, role, loading } = useAuth()

  return useMemo(
    () => ({
      user,
      role,
      loading,
      profile: getUserProfileData(user, role),
    }),
    [loading, role, user],
  )
}
