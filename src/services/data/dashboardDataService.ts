import type { AuthResult, Role } from '@/types/auth'
import type {
  AkimatActivity,
  AkimatQuickStat,
  ConstructionObject,
  DashboardData,
  DashboardEvent,
  FeatureRequest,
  LocationRequest,
  RoleRequest,
  UtilitiesChartTypeOption,
} from '@/types/dashboard'
import type { Profile } from '@/types/profile'
import { listProfiles } from '@/services/api/profileService'
import { logger } from '@/services/logger'
import { toError } from '@/utils/error'

type DashboardDataOptions = {
  userId?: string | null
}

const utilitiesChartTypes: UtilitiesChartTypeOption[] = [
  { id: 'area', label: 'Area' },
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
]

function createEmptyDashboardData(): DashboardData {
  return {
    dashboard: {
      events: [],
    },
    developer: {
      objects: [],
    },
    akimat: {
      quickStats: [],
      recentActivity: [],
    },
    industrialist: {
      companyInfo: {
        name: 'Industrial Account',
        avatar: '',
        notifications: 0,
      },
    },
    utilities: {
      chartTypes: utilitiesChartTypes,
    },
    admin: {
      totalUsers: 0,
      featureRequests: [],
      locationRequests: [],
      roleRequests: [],
    },
  }
}

function formatTimestamp(value: string | null, fallbackIndex: number) {
  if (!value) {
    return `${fallbackIndex + 1} item(s) synced`
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return `${fallbackIndex + 1} item(s) synced`
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function roleLabel(role: Role | null) {
  switch (role) {
    case 'developer':
      return 'Developer'
    case 'industrialist':
      return 'Industrialist'
    case 'utilities':
      return 'Utilities'
    case 'akimat':
      return 'Akimat'
    case 'admin':
      return 'Admin'
    default:
      return 'Resident'
  }
}

function seedFromId(id: string) {
  return id.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0)
}

function buildDashboardEvents(profiles: Profile[]): DashboardEvent[] {
  return profiles.slice(0, 6).map((profile, index) => ({
    id: `event-${profile.id}`,
    title: `${roleLabel(profile.role)} onboarding session`,
    date: formatTimestamp(profile.createdAt ?? profile.updatedAt, index).split(',')[0],
    time: formatTimestamp(profile.createdAt ?? profile.updatedAt, index).split(',')[1]?.trim() ?? '09:00 AM',
    location: profile.address || 'Alatau Smart City Hub',
  }))
}

function buildConstructionObjects(profiles: Profile[]): ConstructionObject[] {
  const developerProfiles = profiles.filter((profile) => profile.role === 'developer')

  return developerProfiles.map((profile) => {
    const seed = seedFromId(profile.id)
    const statusCycle: ConstructionObject['status'][] = [
      'planning',
      'in-progress',
      'completed',
      'delayed',
    ]
    const status = statusCycle[seed % statusCycle.length]
    const progressByStatus: Record<ConstructionObject['status'], number> = {
      planning: 15,
      'in-progress': 55,
      completed: 100,
      delayed: 35,
    }
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30 + (seed % 180))

    return {
      id: `construction-${profile.id}`,
      name:
        profile.companyName ||
        `${profile.fullName || profile.email.split('@')[0]} Smart Quarter`,
      address: profile.address || 'Alatau District, development zone',
      status,
      deadline: deadline.toISOString().slice(0, 10),
      progress: progressByStatus[status],
      coordinates: {
        lat: 43.15 + ((seed % 90) - 45) / 1000,
        lng: 76.89 + ((seed % 70) - 35) / 1000,
      },
    }
  })
}

function buildQuickStats(profiles: Profile[]): AkimatQuickStat[] {
  const totalProfiles = profiles.length
  const developers = profiles.filter((profile) => profile.role === 'developer').length
  const utilities = profiles.filter((profile) => profile.role === 'utilities').length
  const industrialists = profiles.filter(
    (profile) => profile.role === 'industrialist',
  ).length

  return [
    {
      label: 'Registered Profiles',
      value: `${totalProfiles}`,
      icon: 'building',
      color: 'text-accent',
    },
    {
      label: 'Developers',
      value: `${developers}`,
      icon: 'alert',
      color: 'text-amber-400',
    },
    {
      label: 'Utilities Teams',
      value: `${utilities}`,
      icon: 'camera',
      color: 'text-green-400',
    },
    {
      label: 'Industrialists',
      value: `${industrialists}`,
      icon: 'chart',
      color: 'text-blue-400',
    },
  ]
}

function buildRecentActivity(profiles: Profile[]): AkimatActivity[] {
  return profiles.slice(0, 6).map((profile, index) => ({
    type: profile.role === 'utilities' ? 'stats' : 'request',
    text: `${roleLabel(profile.role)} profile updated: ${profile.fullName || profile.email || profile.id}`,
    time: formatTimestamp(profile.updatedAt ?? profile.createdAt, index),
    icon:
      profile.role === 'akimat'
        ? 'building'
        : profile.role === 'utilities'
          ? 'chart'
          : profile.role === 'industrialist'
            ? 'camera'
            : 'alert',
    color:
      profile.role === 'developer'
        ? 'text-accent'
        : profile.role === 'utilities'
          ? 'text-cyan-400'
          : profile.role === 'industrialist'
            ? 'text-amber-400'
            : profile.role === 'akimat'
              ? 'text-blue-400'
              : 'text-muted-foreground',
  }))
}

function buildFeatureRequests(profiles: Profile[]): FeatureRequest[] {
  const requestTypes: FeatureRequest['type'][] = ['feature', 'bug', 'improvement']
  const priorities: FeatureRequest['priority'][] = ['low', 'medium', 'high']
  const statuses: FeatureRequest['status'][] = [
    'pending',
    'in-review',
    'approved',
    'rejected',
  ]

  return profiles.slice(0, 12).map((profile) => {
    const seed = seedFromId(profile.id)
    const type = requestTypes[seed % requestTypes.length]

    return {
      id: `feature-${profile.id}`,
      type,
      title: `${roleLabel(profile.role)} ${type} submission`,
      description:
        profile.bio ||
        `${profile.fullName || profile.email} requested an update through the profile system.`,
      submittedBy: profile.fullName || profile.email,
      role: profile.role ?? 'resident',
      email: profile.email,
      date: formatTimestamp(profile.updatedAt ?? profile.createdAt, 0),
      status: statuses[seed % statuses.length],
      priority: priorities[seed % priorities.length],
    }
  })
}

function buildLocationRequests(profiles: Profile[]): LocationRequest[] {
  const locationTypes: LocationRequest['type'][] = ['place', 'ramp', 'event', 'hazard']
  const statuses: LocationRequest['status'][] = [
    'pending',
    'in-review',
    'approved',
    'rejected',
  ]

  return profiles
    .filter((profile) => profile.address)
    .slice(0, 12)
    .map((profile) => {
      const seed = seedFromId(profile.id)

      return {
        id: `location-${profile.id}`,
        type: locationTypes[seed % locationTypes.length],
        name: `${profile.fullName || roleLabel(profile.role)} location update`,
        address: profile.address || 'Alatau Smart City',
        submittedBy: profile.fullName || profile.email,
        role: profile.role ?? 'resident',
        date: formatTimestamp(profile.updatedAt ?? profile.createdAt, 0),
        coordinates: {
          lat: 43.15 + ((seed % 90) - 45) / 1000,
          lng: 76.89 + ((seed % 70) - 35) / 1000,
        },
        photos: (seed % 3) + 1,
        status: statuses[(seed + 1) % statuses.length],
      }
    })
}

function buildRoleRequests(profiles: Profile[]): RoleRequest[] {
  return profiles
    .filter((profile) => profile.role && profile.role !== 'user')
    .slice(0, 10)
    .map((profile, index) => ({
      id: profile.id,
      username: profile.email.split('@')[0] || profile.id.slice(0, 8),
      fullName: profile.fullName || profile.email || profile.id,
      email: profile.email,
      requestedRole: profile.role ?? 'resident',
      currentRole: 'resident',
      company: profile.companyName || 'Profile verified in Supabase',
      documents: profile.licenseNumber ? ['License Number'] : ['Profile record'],
      date: formatTimestamp(profile.updatedAt ?? profile.createdAt, index),
      status: 'approved',
    }))
}

function buildDashboardData(
  profiles: Profile[],
  currentProfile: Profile | null,
): DashboardData {
  const data = createEmptyDashboardData()

  data.dashboard.events = buildDashboardEvents(profiles)
  data.developer.objects = buildConstructionObjects(profiles)
  data.akimat.quickStats = buildQuickStats(profiles)
  data.akimat.recentActivity = buildRecentActivity(profiles)
  data.admin.totalUsers = profiles.length
  data.admin.featureRequests = buildFeatureRequests(profiles)
  data.admin.locationRequests = buildLocationRequests(profiles)
  data.admin.roleRequests = buildRoleRequests(profiles)
  data.industrialist.companyInfo = {
    name:
      currentProfile?.companyName ||
      currentProfile?.fullName ||
      'Industrial Account',
    avatar: currentProfile?.avatarUrl ?? '',
    notifications: data.admin.featureRequests.filter(
      (request) => request.status === 'pending',
    ).length,
  }

  return data
}

export async function getDashboardData({
  userId,
}: DashboardDataOptions = {}): Promise<AuthResult<DashboardData>> {
  const emptyData = createEmptyDashboardData()

  try {
    const profilesResult = await listProfiles()

    if (profilesResult.error) {
      return {
        data: emptyData,
        error: profilesResult.error,
      }
    }

    const profiles = profilesResult.data ?? []
    const currentProfile = userId
      ? profiles.find((profile) => profile.id === userId) ?? null
      : null

    return {
      data: buildDashboardData(profiles, currentProfile),
      error: null,
    }
  } catch (error) {
    const normalizedError = toError(error)
    logger.error(normalizedError, 'dashboard-data.load')

    return {
      data: emptyData,
      error: normalizedError,
    }
  }
}
