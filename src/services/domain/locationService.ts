import { supabase } from '@/services/supabaseClient'
import { logger } from '@/services/logger'
import type { AuthResult } from '@/types/auth'
import type { LocationItem, LocationZone } from '@/types/location'
import { toError } from '@/utils/error'

type LocationRecord = {
  id: string
  name: string | null
  zone: LocationZone | null
  lat: number | null
  lon: number | null
  created_at: string | null
}

type LocationCreateInput = {
  name: string
  zone?: LocationZone
  lat: number
  lon: number
}

function mapLocation(record: LocationRecord): LocationItem {
  return {
    id: record.id,
    name: record.name ?? 'Unknown location',
    zone: record.zone ?? 'Gate',
    lat: record.lat ?? 43.238949,
    lon: record.lon ?? 76.889709,
    createdAt: record.created_at ?? '',
  }
}

export const locationService = {
  async list(): Promise<AuthResult<LocationItem[]>> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true })
        .returns<LocationRecord[]>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: (data ?? []).map(mapLocation),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'location.list')

      return {
        data: null,
        error: normalizedError,
      }
    }
  },

  async create(input: LocationCreateInput): Promise<AuthResult<LocationItem>> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: input.name,
          zone: input.zone ?? 'Growing',
          lat: input.lat,
          lon: input.lon,
        })
        .select('*')
        .single<LocationRecord>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: mapLocation(data),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'location.create')

      return {
        data: null,
        error: normalizedError,
      }
    }
  },
}
