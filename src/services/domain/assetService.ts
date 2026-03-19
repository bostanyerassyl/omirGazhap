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
  name: string | null
  address: string | null
  description: string | null
  contact_phone: string | null
  deadline: string | null
  progress: number | null
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
    name: record.name,
    address: record.address,
    description: record.description,
    contactPhone: record.contact_phone,
    deadline: record.deadline,
    progress: record.progress,
    type: record.type ?? 'asset',
    status: record.status ?? 'active',
    createdAt: record.created_at ?? '',
    updatedAt: record.updated_at ?? '',
  }
}

type AssetMutationInput = {
  locationId?: string | null
  createdBy?: string | null
  ownerProfileId?: string | null
  ownerRole?: string | null
  name?: string | null
  address?: string | null
  description?: string | null
  contactPhone?: string | null
  deadline?: string | null
  progress?: number | null
  type?: string | null
  status?: string | null
}

function serializeAssetMutation(input: AssetMutationInput) {
  const payload: Record<string, string | number | null> = {}

  if (input.locationId !== undefined) payload.location_id = input.locationId
  if (input.createdBy !== undefined) payload.created_by = input.createdBy
  if (input.ownerProfileId !== undefined) payload.owner_profile_id = input.ownerProfileId
  if (input.ownerRole !== undefined) payload.owner_role = input.ownerRole
  if (input.name !== undefined) payload.name = input.name
  if (input.address !== undefined) payload.address = input.address
  if (input.description !== undefined) payload.description = input.description
  if (input.contactPhone !== undefined) payload.contact_phone = input.contactPhone
  if (input.deadline !== undefined) payload.deadline = input.deadline
  if (input.progress !== undefined) payload.progress = input.progress
  if (input.type !== undefined) payload.type = input.type
  if (input.status !== undefined) payload.status = input.status

  return payload
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

  async create(input: AssetMutationInput): Promise<AuthResult<AssetItem>> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert(serializeAssetMutation(input))
        .select('*, locations(name, lat, lon)')
        .single<AssetRecord>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: mapAsset(data),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'asset.create')
      return {
        data: null,
        error: normalizedError,
      }
    }
  },

  async update(id: string, input: AssetMutationInput): Promise<AuthResult<AssetItem>> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .update(serializeAssetMutation(input))
        .eq('id', id)
        .select('*, locations(name, lat, lon)')
        .single<AssetRecord>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: mapAsset(data),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'asset.update')
      return {
        data: null,
        error: normalizedError,
      }
    }
  },
}
