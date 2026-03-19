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
      reloadData: context.reloadData,
      submitDashboardAppeal: context.submitDashboardAppeal,
      addDashboardPlace: context.addDashboardPlace,
      saveDeveloperObject: context.saveDeveloperObject,
      createDeveloperObject: context.createDeveloperObject,
      reportDeveloperObject: context.reportDeveloperObject,
      reportIndustrialIncident: context.reportIndustrialIncident,
      sendIndustrialSummaryReport: context.sendIndustrialSummaryReport,
      reportUtilitiesIssue: context.reportUtilitiesIssue,
      updateAkimatRequestStatus: context.updateAkimatRequestStatus,
      reviewAdminItem: context.reviewAdminItem,
    }),
    [context, section],
  )
}
