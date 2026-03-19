import { supabase } from '@/services/supabaseClient'
import { logger } from '@/services/logger'
import type { AuthResult, Role } from '@/types/auth'
import type { EventItem, EventSeverity } from '@/types/event'
import { toError } from '@/utils/error'

type EventRecord = {
  id: string
  asset_id: string | null
  location_id: string | null
  created_by: string | null
  title: string | null
  description: string | null
  event_type: string | null
  severity: EventSeverity | null
  starts_at: string | null
  ends_at: string | null
  is_public: boolean | null
  created_at: string | null
  updated_at: string | null
  locations?: {
    name: string | null
  } | null
}

function mapEvent(record: EventRecord): EventItem {
  return {
    id: record.id,
    assetId: record.asset_id,
    locationId: record.location_id,
    locationName: record.locations?.name ?? null,
    createdBy: record.created_by,
    title: record.title ?? record.event_type ?? 'Event',
    description: record.description ?? '',
    eventType: record.event_type ?? 'general',
    severity: record.severity ?? 'medium',
    startsAt: record.starts_at,
    endsAt: record.ends_at,
    isPublic: record.is_public ?? false,
    createdAt: record.created_at ?? '',
    updatedAt: record.updated_at ?? '',
  }
}

export const eventService = {
  async list(role: Role | null, userId: string | null): Promise<AuthResult<EventItem[]>> {
    try {
      let query = supabase
        .from('events')
        .select('*, locations(name)')
        .order('created_at', { ascending: false })

      if (role === 'user' && userId) {
        query = query.or(`created_by.eq.${userId},is_public.eq.true`)
      }

      if (role === 'utilities') {
        query = query.eq('event_type', 'utility')
      }

      if (role === 'developer') {
        query = query.eq('event_type', 'construction')
      }

      const { data, error } = await query.returns<EventRecord[]>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: (data ?? []).map(mapEvent),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'event.list')
      return {
        data: null,
        error: normalizedError,
      }
    }
  },
}
