import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useAuth } from '@/features/auth/model/AuthProvider'
import { adminService } from '@/services/domain/adminService'
import { caseService } from '@/services/domain/caseService'
import { getDashboardData } from '@/services/data/dashboardDataService'
import { logger } from '@/services/logger'
import type { AuthResult } from '@/types/auth'
import type {
  AdminReviewAction,
  AdminReviewTarget,
  ConstructionObject,
  CitizenRequestStatus,
  DashboardData,
} from '@/types/dashboard'

type AppDataContextValue = {
  data: DashboardData | null
  loading: boolean
  error: string | null
  reloadData: () => Promise<void>
  updateDeveloperObject: (object: ConstructionObject) => void
  updateAkimatRequestStatus: (
    id: string,
    status: CitizenRequestStatus,
  ) => Promise<AuthResult<null>>
  reviewAdminItem: (
    target: AdminReviewTarget,
    id: string,
    action: AdminReviewAction,
    note?: string,
  ) => Promise<AuthResult<null>>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: PropsWithChildren) {
  const { user, role } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const result = await getDashboardData({
      userId: user?.id ?? null,
      role,
    })

    if (result.error) {
      logger.error(result.error, 'app-data.load')
      setError(result.error.message)
    } else {
      setError(null)
    }

    setData(result.data)
    setLoading(false)
  }, [role, user?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      loading,
      error,
      reloadData: loadData,
      updateDeveloperObject(object) {
        setData((current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            developer: {
              ...current.developer,
              objects: current.developer.objects.map((item) =>
                item.id === object.id ? object : item,
              ),
            },
          }
        })
      },
      async updateAkimatRequestStatus(id, status) {
        const nextStatus =
          status === 'in-progress'
            ? 'in_progress'
            : status === 'resolved'
              ? 'resolved'
              : status === 'rejected'
                ? 'rejected'
                : 'open'

        const result = await caseService.updateStatus(id, nextStatus)

        if (!result.error) {
          await loadData()
        }

        return {
          data: null,
          error: result.error,
        }
      },
      async reviewAdminItem(target, id, action, note) {
        if (!user) {
          return {
            data: null,
            error: new Error('User is not authenticated'),
          }
        }

        const result = await adminService.reviewItem(
          target,
          id,
          action,
          note,
          user.id,
        )

        if (!result.error) {
          await loadData()
        }

        return result
      },
    }),
    [data, loadData, loading, user],
  )

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  )
}

export function useAppDataContext() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppDataContext must be used within AppDataProvider')
  }

  return context
}
