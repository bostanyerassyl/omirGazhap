import { useMemo } from 'react'
import { useAppDataContext } from '@/features/app/model/AppDataProvider'
import type { DashboardData } from '@/types/dashboard'

export function useDashboardData<K extends keyof DashboardData>(section: K) {
  const context = useAppDataContext()

  return useMemo(
    () => ({
      data: context.data?.[section] ?? null,
      loading: context.loading,
      error: context.error,
      updateDeveloperObject: context.updateDeveloperObject,
      reviewAdminItem: context.reviewAdminItem,
    }),
    [context, section],
  )
}
