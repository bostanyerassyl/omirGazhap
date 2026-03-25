import { supabase } from '@/services/supabaseClient'
import { logger } from '@/services/logger'
import type { AuthResult } from '@/types/auth'
import type { PoiCreateInput, PoiItem, PoiCategory } from '@/types/poi'
import { toError } from '@/utils/error'

type PoiRecord = {
  id: string
  category: PoiCategory | null
  name: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

function mapPoi(record: PoiRecord): PoiItem {
  return {
    id: record.id,
    category: record.category ?? 'events',
    name: record.name ?? 'Unknown',
    description: record.description ?? null,
    latitude: record.latitude ?? 0,
    longitude: record.longitude ?? 0,
    createdBy: record.created_by,
    createdAt: record.created_at ?? '',
  }
}

export const poiService = {
  async list(): Promise<AuthResult<PoiItem[]>> {
    try {
      const { data, error } = await supabase
        .from('map_pois')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<PoiRecord[]>()

      if (error) {
        return { data: null, error }
      }

      return { data: (data ?? []).filter((rec) => rec !== null).map(mapPoi), error: null }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'poi.list')
      return { data: null, error: normalizedError }
    }
  },

  async create(input: PoiCreateInput): Promise<AuthResult<PoiItem>> {
    try {
      const { data, error } = await supabase
        .from('map_pois')
        .insert({
          category: input.category,
          name: input.name,
          description: input.description ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
          created_by: input.createdBy ?? null,
        })
        .select('*')
        .single<PoiRecord>()

      if (error) {
        return { data: null, error }
      }

      if (!data) {
        return { data: null, error: new Error('Poi creation returned no data') }
      }

      return { data: mapPoi(data), error: null }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'poi.create')
      return { data: null, error: normalizedError }
    }
  },
}
