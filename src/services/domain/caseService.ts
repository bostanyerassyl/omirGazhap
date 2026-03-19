import { supabase } from '@/services/supabaseClient'
import { logger } from '@/services/logger'
import type { AuthResult, Role } from '@/types/auth'
import type { CaseItem, CasePriority, CaseStatus, CaseVisibility } from '@/types/case'
import { toError } from '@/utils/error'

type CaseRecord = {
  id: string
  event_id: string | null
  created_by: string | null
  assigned_to: string | null
  assigned_role: string | null
  status: CaseStatus | null
  priority: CasePriority | null
  visibility: CaseVisibility | null
  created_at: string | null
  updated_at: string | null
  resolved_at: string | null
}

function mapCase(record: CaseRecord): CaseItem {
  return {
    id: record.id,
    eventId: record.event_id,
    createdBy: record.created_by,
    assignedTo: record.assigned_to,
    assignedRole: record.assigned_role,
    status: record.status ?? 'open',
    priority: record.priority ?? 'medium',
    visibility: record.visibility ?? 'owner',
    createdAt: record.created_at ?? '',
    updatedAt: record.updated_at ?? '',
    resolvedAt: record.resolved_at,
  }
}

export const caseService = {
  async list(role: Role | null, userId: string | null): Promise<AuthResult<CaseItem[]>> {
    try {
      let query = supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false })

      if (role === 'user' && userId) {
        query = query.or(
          `created_by.eq.${userId},assigned_to.eq.${userId},visibility.eq.public`,
        )
      } else if (role && ['utilities', 'akimat', 'admin'].includes(role)) {
        query = query.eq('assigned_role', role)
      }

      const { data, error } = await query.returns<CaseRecord[]>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: (data ?? []).map(mapCase),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'case.list')
      return {
        data: null,
        error: normalizedError,
      }
    }
  },

  async updateStatus(id: string, status: CaseStatus): Promise<AuthResult<CaseItem>> {
    try {
      const payload: {
        status: CaseStatus
        resolved_at?: string | null
      } = {
        status,
      }

      if (status === 'resolved' || status === 'closed') {
        payload.resolved_at = new Date().toISOString()
      } else if (status === 'rejected' || status === 'open' || status === 'in_progress') {
        payload.resolved_at = null
      }

      const { data, error } = await supabase
        .from('cases')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single<CaseRecord>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: mapCase(data),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'case.updateStatus')
      return {
        data: null,
        error: normalizedError,
      }
    }
  },

  async create(input: {
    eventId?: string | null
    createdBy?: string | null
    assignedTo?: string | null
    assignedRole: Role | 'resident'
    status?: CaseStatus
    priority?: CasePriority
    visibility?: CaseVisibility
  }): Promise<AuthResult<CaseItem>> {
    try {
      const payload = {
        event_id: input.eventId ?? null,
        created_by: input.createdBy ?? null,
        assigned_to: input.assignedTo ?? null,
        assigned_role: input.assignedRole === 'user' ? 'resident' : input.assignedRole,
        status: input.status ?? 'open',
        priority: input.priority ?? 'medium',
        visibility: input.visibility ?? 'public',
      }

      const { data, error } = await supabase
        .from('cases')
        .insert(payload)
        .select('*')
        .single<CaseRecord>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: mapCase(data),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'case.create')
      return {
        data: null,
        error: normalizedError,
      }
    }
  },
}
