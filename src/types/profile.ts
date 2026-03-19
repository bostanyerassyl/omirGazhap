import type { Role } from './auth'

export type ProfileDbRole = Role | 'resident'

export type ProfileRecord = {
  id: string
  email: string | null
  full_name: string | null
  role: ProfileDbRole | null
  phone: string | null
  address: string | null
  bio: string | null
  avatar_url: string | null
  company_name: string | null
  license_number: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type Profile = {
  id: string
  email: string
  fullName: string
  role: Role | null
  phone: string
  address: string
  bio: string
  avatarUrl: string
  companyName: string
  licenseNumber: string
  createdAt: string | null
  updatedAt: string | null
}

export type ProfileCreateInput = {
  email?: string | null
  fullName?: string | null
  role?: Role | null
  phone?: string | null
  address?: string | null
  bio?: string | null
  avatarUrl?: string | null
  companyName?: string | null
  licenseNumber?: string | null
}

export type ProfileUpdateInput = Partial<ProfileCreateInput>
