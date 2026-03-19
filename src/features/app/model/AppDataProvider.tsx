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
import { assetService } from '@/services/domain/assetService'
import { caseService } from '@/services/domain/caseService'
import { eventService } from '@/services/domain/eventService'
import { observationService } from '@/services/domain/observationService'
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
  saveDeveloperObject: (object: ConstructionObject) => Promise<AuthResult<ConstructionObject>>
  createDeveloperObject: (object: ConstructionObject) => Promise<AuthResult<ConstructionObject>>
  reportDeveloperObject: (payload: {
    objectId: string
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
  }) => Promise<AuthResult<null>>
  reportIndustrialIncident: (payload: {
    assetId: string
    type: 'leak' | 'excess' | 'violation' | 'accident'
    title: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    consequence: string
    solution: string
  }) => Promise<AuthResult<null>>
  sendIndustrialSummaryReport: (payload: {
    category: 'production' | 'finance'
    title: string
    description: string
    assetId?: string | null
  }) => Promise<AuthResult<null>>
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
      async saveDeveloperObject(object) {
        const result = await assetService.update(object.id, {
          locationId: object.locationId,
          name: object.name,
          address: object.address,
          description: object.description,
          contactPhone: object.contactPhone,
          deadline: object.deadline || null,
          progress: object.progress,
          type: object.type,
          status: object.status,
        })

        if (result.error) {
          return {
            data: null,
            error: result.error,
          }
        }

        await loadData()

        return {
          data: object,
          error: null,
        }
      },
      async createDeveloperObject(object) {
        if (!user) {
          return {
            data: null,
            error: new Error('User is not authenticated'),
          }
        }

        const result = await assetService.create({
          locationId: object.locationId,
          createdBy: user.id,
          ownerProfileId: user.id,
          ownerRole: 'developer',
          name: object.name,
          address: object.address,
          description: object.description,
          contactPhone: object.contactPhone,
          deadline: object.deadline || null,
          progress: object.progress,
          type: object.type,
          status: object.status,
        })

        if (result.error) {
          return {
            data: null,
            error: result.error,
          }
        }

        await loadData()

        return {
          data: object,
          error: null,
        }
      },
      async reportDeveloperObject({ objectId, title, description, priority }) {
        if (!user) {
          return {
            data: null,
            error: new Error('User is not authenticated'),
          }
        }

        const asset = data?.developer.objects.find((item) => item.id === objectId)

        if (!asset) {
          return {
            data: null,
            error: new Error('Construction object was not found'),
          }
        }

        const severity = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1

        const eventResult = await eventService.create({
          assetId: asset.id,
          locationId: asset.locationId,
          createdBy: user.id,
          title,
          description,
          eventType: 'construction',
          severity,
          startsAt: new Date().toISOString(),
          isPublic: true,
        })

        if (eventResult.error || !eventResult.data) {
          return {
            data: null,
            error: eventResult.error ?? new Error('Unable to create event'),
          }
        }

        const caseResult = await caseService.create({
          eventId: eventResult.data.id,
          createdBy: user.id,
          assignedRole: 'akimat',
          status: 'open',
          priority,
          visibility: 'public',
        })

        if (caseResult.error) {
          return {
            data: null,
            error: caseResult.error,
          }
        }

        await loadData()

        return {
          data: null,
          error: null,
        }
      },
      async reportIndustrialIncident({
        assetId,
        type,
        title,
        severity,
        consequence,
        solution,
      }) {
        if (!user) {
          return {
            data: null,
            error: new Error('User is not authenticated'),
          }
        }

        const severityScore =
          severity === 'critical' ? 4 : severity === 'high' ? 3 : severity === 'medium' ? 2 : 1

        const eventResult = await eventService.create({
          assetId,
          createdBy: user.id,
          title,
          description: consequence,
          eventType: `industrial_${type}`,
          severity: severityScore,
          startsAt: new Date().toISOString(),
          isPublic: true,
        })

        if (eventResult.error || !eventResult.data) {
          return {
            data: null,
            error: eventResult.error ?? new Error('Unable to create incident event'),
          }
        }

        const caseResult = await caseService.create({
          eventId: eventResult.data.id,
          createdBy: user.id,
          assignedRole: 'akimat',
          status: 'open',
          priority: severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'medium',
          visibility: 'public',
        })

        if (caseResult.error || !caseResult.data) {
          return {
            data: null,
            error: caseResult.error ?? new Error('Unable to create incident case'),
          }
        }

        const observationResult = await observationService.create({
          assetId,
          caseId: caseResult.data.id,
          createdBy: user.id,
          payload: {
            category: 'industrial',
            incident_type: type,
            title,
            severity,
            consequence,
            solution,
          },
          reviewStatus: 'pending',
        })

        if (observationResult.error) {
          return {
            data: null,
            error: observationResult.error,
          }
        }

        await loadData()

        return {
          data: null,
          error: null,
        }
      },
      async sendIndustrialSummaryReport({ category, title, description, assetId }) {
        if (!user) {
          return {
            data: null,
            error: new Error('User is not authenticated'),
          }
        }

        const eventResult = await eventService.create({
          assetId: assetId ?? null,
          createdBy: user.id,
          title,
          description,
          eventType: category === 'production' ? 'industrial_production' : 'industrial_finance',
          severity: 2,
          startsAt: new Date().toISOString(),
          isPublic: true,
        })

        if (eventResult.error || !eventResult.data) {
          return {
            data: null,
            error: eventResult.error ?? new Error('Unable to create summary event'),
          }
        }

        const caseResult = await caseService.create({
          eventId: eventResult.data.id,
          createdBy: user.id,
          assignedRole: 'akimat',
          status: 'open',
          priority: 'medium',
          visibility: 'public',
        })

        if (caseResult.error) {
          return {
            data: null,
            error: caseResult.error,
          }
        }

        await loadData()

        return {
          data: null,
          error: null,
        }
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
