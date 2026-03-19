import { supabase } from '@/services/supabaseClient'
import { logger } from '@/services/logger'
import type { AssetItem } from '@/types/asset'
import type { AuthResult, Role } from '@/types/auth'
import { toError } from '@/utils/error'

type AssetRecord = {
  id: string
  location_id: string | null
  created_by: string | null
  owner_profile_id: string | null
  owner_role: string | null
  type: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  locations?: {
    name: string | null
    lat: number | null
    lon: number | null
  } | null
}

function mapAsset(record: AssetRecord): AssetItem {
  return {
    id: record.id,
    locationId: record.location_id,
    locationName: record.locations?.name ?? null,
    latitude: record.locations?.lat ?? null,
    longitude: record.locations?.lon ?? null,
    createdBy: record.created_by,
    ownerProfileId: record.owner_profile_id,
    ownerRole: record.owner_role,
    type: record.type ?? 'asset',
    status: record.status ?? 'active',
    createdAt: record.created_at ?? '',
    updatedAt: record.updated_at ?? '',
  }
}

export const assetService = {
  async list(role: Role | null, userId: string | null): Promise<AuthResult<AssetItem[]>> {
    try {
      let query = supabase
        .from('assets')
        .select('*, locations(name, lat, lon)')
        .order('created_at', { ascending: false })

      if (
        role &&
        ['developer', 'industrialist'].includes(role) &&
        userId
      ) {
        query = query.or(`created_by.eq.${userId},owner_profile_id.eq.${userId}`)
      }

      if (role === 'utilities') {
        query = query.eq('owner_role', 'utilities')
      }

      const { data, error } = await query.returns<AssetRecord[]>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: (data ?? []).map(mapAsset),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'asset.list')
      return {
        data: null,
        error: normalizedError,
      }
    }
  },
}
