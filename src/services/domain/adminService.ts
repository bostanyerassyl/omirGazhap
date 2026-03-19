import { supabase } from '@/services/supabaseClient'
import { logger } from '@/services/logger'
import type { AuthResult } from '@/types/auth'
import type { AdminReviewAction, AdminReviewTarget, AdminRequestStatus } from '@/types/dashboard'
import { toError } from '@/utils/error'

type RoleRequestRecord = {
  id: string
  user_id: string
  requested_role: string
  company: string | null
  documents: string[] | null
  status: AdminRequestStatus | null
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string | null
  updated_at: string | null
}

function toAdminError<T>(error: unknown, context: string): AuthResult<T> {
  const normalizedError = toError(error)
  logger.error(normalizedError, context)

  return {
    data: null,
    error: normalizedError,
  }
}

function nextReviewStatus(action: AdminReviewAction): AdminRequestStatus {
  return action === 'approve' ? 'approved' : 'rejected'
}

export const adminService = {
  async listRoleRequests(): Promise<AuthResult<RoleRequestRecord[]>> {
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<RoleRequestRecord[]>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: data ?? [],
        error: null,
      }
    } catch (error) {
      return toAdminError<RoleRequestRecord[]>(error, 'admin.listRoleRequests')
    }
  },

  async reviewItem(
    target: AdminReviewTarget,
    id: string,
    action: AdminReviewAction,
    note: string | undefined,
    reviewerId: string,
  ): Promise<AuthResult<null>> {
    try {
      const status = nextReviewStatus(action)
      const reviewedAt = new Date().toISOString()

      if (target === 'request') {
        const nextCaseStatus = action === 'approve' ? 'resolved' : 'rejected'
        const { error } = await supabase
          .from('cases')
          .update({
            status: nextCaseStatus,
            review_note: note ?? null,
            reviewed_by: reviewerId,
            reviewed_at: reviewedAt,
            resolved_at: action === 'approve' ? reviewedAt : null,
          })
          .eq('id', id)

        if (error) {
          return {
            data: null,
            error,
          }
        }

        return {
          data: null,
          error: null,
        }
      }

      if (target === 'location') {
        const { error } = await supabase
          .from('observations')
          .update({
            review_status: status,
            review_note: note ?? null,
            reviewed_by: reviewerId,
            reviewed_at: reviewedAt,
          })
          .eq('id', id)

        if (error) {
          return {
            data: null,
            error,
          }
        }

        return {
          data: null,
          error: null,
        }
      }

      const { data: roleRequest, error: roleRequestError } = await supabase
        .from('role_requests')
        .update({
          status,
          admin_note: note ?? null,
          reviewed_by: reviewerId,
          reviewed_at: reviewedAt,
        })
        .eq('id', id)
        .select('id, user_id, requested_role')
        .single<{ id: string; user_id: string; requested_role: string }>()

      if (roleRequestError) {
        return {
          data: null,
          error: roleRequestError,
        }
      }

      if (action === 'approve') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: roleRequest.requested_role,
          })
          .eq('id', roleRequest.user_id)

        if (profileError) {
          return {
            data: null,
            error: profileError,
          }
        }
      }

      return {
        data: null,
        error: null,
      }
    } catch (error) {
      return toAdminError<null>(error, 'admin.reviewItem')
    }
  },
}
