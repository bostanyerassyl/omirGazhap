import type { User } from '@supabase/supabase-js'
import type { Role } from '@/types/auth'

export type UserProfileData = {
  name: string
  email: string
  label: string
  initials: string
}

const defaultProfiles: Record<Role, Omit<UserProfileData, 'email'>> = {
  user: {
    name: 'City Resident',
    label: 'Resident Account',
    initials: 'CR',
  },
  developer: {
    name: 'Alatau Development Corp',
    label: 'Developer Account',
    initials: 'AD',
  },
  industrialist: {
    name: 'Alatau Steel Works',
    label: 'Industrial Enterprise',
    initials: 'AS',
  },
  utilities: {
    name: 'Alatau Utilities',
    label: 'ЖКХ',
    initials: 'JK',
  },
  akimat: {
    name: 'Akimat Administrator',
    label: 'City Administration',
    initials: 'AK',
  },
  admin: {
    name: 'System Administrator',
    label: 'Admin Account',
    initials: 'AD',
  },
}

export function getUserProfileData(user: User | null, role: Role | null): UserProfileData | null {
  if (!role) {
    return null
  }

  const defaults = defaultProfiles[role]
  const fullName =
    typeof user?.user_metadata.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : defaults.name
  const email = user?.email ?? ''
  const initials = fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || defaults.initials

  return {
    name: fullName,
    email,
    label: defaults.label,
    initials,
  }
}
