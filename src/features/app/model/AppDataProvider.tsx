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
import { getDashboardData } from '@/services/data/dashboardDataService'
import { logger } from '@/services/logger'
import type {
  AdminReviewAction,
  AdminReviewTarget,
  ConstructionObject,
  DashboardData,
} from '@/types/dashboard'

type AppDataContextValue = {
  data: DashboardData | null
  loading: boolean
  error: string | null
  reloadData: () => Promise<void>
  updateDeveloperObject: (object: ConstructionObject) => void
  reviewAdminItem: (
    target: AdminReviewTarget,
    id: string,
    action: AdminReviewAction,
  ) => void
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
      reviewAdminItem(target, id, action) {
        const nextStatus = action === 'approve' ? 'approved' : 'rejected'

        setData((current) => {
          if (!current) {
            return current
          }

          if (target === 'request') {
            return {
              ...current,
              admin: {
                ...current.admin,
                featureRequests: current.admin.featureRequests.map((item) =>
                  item.id === id ? { ...item, status: nextStatus } : item,
                ),
              },
            }
          }

          if (target === 'location') {
            return {
              ...current,
              admin: {
                ...current.admin,
                locationRequests: current.admin.locationRequests.map((item) =>
                  item.id === id ? { ...item, status: nextStatus } : item,
                ),
              },
            }
          }

          return {
            ...current,
            admin: {
              ...current.admin,
              roleRequests: current.admin.roleRequests.map((item) =>
                item.id === id ? { ...item, status: nextStatus } : item,
              ),
            },
          }
        })
      },
    }),
    [data, error, loadData, loading],
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
