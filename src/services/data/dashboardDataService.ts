import { assetService } from '@/services/domain/assetService'
import { adminService } from '@/services/domain/adminService'
import { caseService } from '@/services/domain/caseService'
import { eventService } from '@/services/domain/eventService'
import { observationService } from '@/services/domain/observationService'
import {
  countProfiles,
  getProfile,
  listProfilesByIds,
} from '@/services/api/profileService'
import { logger } from '@/services/logger'
import type { AuthResult, Role } from '@/types/auth'
import type { AssetItem } from '@/types/asset'
import type { CaseItem } from '@/types/case'
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
import type { EventItem } from '@/types/event'
import type { ObservationItem } from '@/types/observation'
import type { Profile } from '@/types/profile'
import { toError } from '@/utils/error'

type DashboardDataOptions = {
  userId?: string | null
  role?: Role | null
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

function formatTimestamp(value: string | null, fallback = 'Recently updated') {
  if (!value) {
    return fallback
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function severityToPriority(
  severity: EventItem['severity'],
): FeatureRequest['priority'] {
  switch (severity) {
    case 'critical':
      return 'high'
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    default:
      return 'low'
  }
}

function caseStatusToAdminStatus(
  status: CaseItem['status'],
): FeatureRequest['status'] {
  switch (status) {
    case 'resolved':
      return 'approved'
    case 'closed':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'in_progress':
      return 'in-review'
    default:
      return 'pending'
  }
}

function actorName(
  profilesMap: Record<string, Profile>,
  userId: string | null,
  fallback: string,
) {
  if (!userId) {
    return fallback
  }

  return profilesMap[userId]?.fullName || profilesMap[userId]?.email || fallback
}

function actorEmail(
  profilesMap: Record<string, Profile>,
  userId: string | null,
) {
  if (!userId) {
    return 'unknown@system.local'
  }

  return profilesMap[userId]?.email || 'unknown@system.local'
}

function actorRole(
  profilesMap: Record<string, Profile>,
  userId: string | null,
) {
  if (!userId) {
    return 'resident' as const
  }

  return profilesMap[userId]?.role ?? 'resident'
}

function buildDashboardEvents(events: EventItem[]): DashboardEvent[] {
  return events.slice(0, 6).map((event) => {
    const timestamp = event.startsAt ?? event.createdAt
    const formattedTimestamp = formatTimestamp(timestamp, 'TBD')
    const [date, time = 'TBD'] = formattedTimestamp.split(',')

    return {
      id: event.id,
      title: event.title,
      date,
      time: time.trim(),
      location: event.locationName ?? 'Alatau Smart City',
    }
  })
}

function buildConstructionObjects(assets: AssetItem[]): ConstructionObject[] {
  return assets.slice(0, 12).map((asset, index) => {
    const statusCycle: ConstructionObject['status'][] = [
      'planning',
      'in-progress',
      'completed',
      'delayed',
    ]
    const derivedStatus = statusCycle[index % statusCycle.length]
    const createdAt = asset.createdAt ? new Date(asset.createdAt) : new Date()
    const deadline = new Date(createdAt)
    deadline.setDate(deadline.getDate() + 90)

    return {
      id: asset.id,
      name: `${asset.type.charAt(0).toUpperCase()}${asset.type.slice(1)} Asset`,
      address: asset.locationName ?? 'Unassigned location',
      status: asset.status === 'active' ? derivedStatus : 'delayed',
      deadline: deadline.toISOString().slice(0, 10),
      progress: asset.status === 'active' ? 55 : 25,
      coordinates: {
        lat: asset.latitude ?? 43.238949,
        lng: asset.longitude ?? 76.889709,
      },
    }
  })
}

function buildQuickStats(
  assets: AssetItem[],
  cases: CaseItem[],
  events: EventItem[],
  observations: ObservationItem[],
): AkimatQuickStat[] {
  return [
    {
      label: 'Tracked Assets',
      value: `${assets.length}`,
      icon: 'building',
      color: 'text-accent',
    },
    {
      label: 'Open Cases',
      value: `${cases.filter((item) => item.status === 'open').length}`,
      icon: 'alert',
      color: 'text-amber-400',
    },
    {
      label: 'Active Events',
      value: `${events.length}`,
      icon: 'camera',
      color: 'text-green-400',
    },
    {
      label: 'Observations',
      value: `${observations.length}`,
      icon: 'chart',
      color: 'text-blue-400',
    },
  ]
}

function buildRecentActivity(
  events: EventItem[],
  cases: CaseItem[],
): AkimatActivity[] {
  const eventActivity = events.slice(0, 3).map<AkimatActivity>((event) => ({
    type: 'facility',
    text: `${event.title} at ${event.locationName ?? 'Alatau Smart City'}`,
    time: formatTimestamp(event.createdAt),
    icon: event.eventType === 'utility' ? 'chart' : 'camera',
    color: event.eventType === 'utility' ? 'text-cyan-400' : 'text-accent',
  }))

  const caseActivity = cases.slice(0, 3).map<AkimatActivity>((item) => ({
    type: 'request',
    text: `Case ${item.id.slice(0, 8)} is ${item.status.replace('_', ' ')}`,
    time: formatTimestamp(item.updatedAt || item.createdAt),
    icon: 'alert',
    color: item.status === 'resolved' ? 'text-green-400' : 'text-amber-400',
  }))

  return [...eventActivity, ...caseActivity].slice(0, 6)
}

function buildFeatureRequests(
  cases: CaseItem[],
  events: EventItem[],
  profilesMap: Record<string, Profile>,
): FeatureRequest[] {
  return cases.slice(0, 12).map((item) => {
    const relatedEvent = events.find((event) => event.id === item.eventId)

    return {
      id: item.id,
      type:
        relatedEvent?.eventType === 'bug'
          ? 'bug'
          : relatedEvent?.eventType === 'improvement'
            ? 'improvement'
            : 'feature',
      title: relatedEvent?.title || `Case ${item.id.slice(0, 8)}`,
      description:
        relatedEvent?.description ||
        `Case assigned to ${item.assignedRole ?? 'unassigned'} role.`,
      submittedBy: actorName(profilesMap, item.createdBy, 'System User'),
      role: actorRole(profilesMap, item.createdBy),
      email: actorEmail(profilesMap, item.createdBy),
      date: formatTimestamp(item.createdAt),
      status: caseStatusToAdminStatus(item.status),
      priority:
        relatedEvent?.severity
          ? severityToPriority(relatedEvent.severity)
          : item.priority === 'urgent' || item.priority === 'high'
            ? 'high'
            : item.priority === 'medium'
              ? 'medium'
              : 'low',
    }
  })
}

function buildLocationRequests(
  observations: ObservationItem[],
  profilesMap: Record<string, Profile>,
): LocationRequest[] {
  return observations.slice(0, 12).map((item, index) => ({
    id: item.id,
    type: (['place', 'ramp', 'event', 'hazard'] as const)[index % 4],
    name: `Observation ${item.id.slice(0, 8)}`,
    address: item.locationName ?? 'Unknown location',
    submittedBy: actorName(profilesMap, item.createdBy, 'System User'),
    role: actorRole(profilesMap, item.createdBy),
    date: formatTimestamp(item.timestamp),
    coordinates: {
      lat: 43.238949 + index / 1000,
      lng: 76.889709 + index / 1000,
    },
    photos: 0,
    status: item.reviewStatus,
  }))
}

function buildRoleRequests(
  roleRequests: Awaited<ReturnType<typeof adminService.listRoleRequests>>['data'],
  profilesMap: Record<string, Profile>,
): RoleRequest[] {
  return (roleRequests ?? []).slice(0, 12).map((item) => {
    const requester = profilesMap[item.user_id]
    const email = requester?.email ?? 'unknown@system.local'
    const fullName = requester?.fullName || email
    const username = email.split('@')[0] || fullName.toLowerCase().replace(/\s+/g, '.')

    return {
      id: item.id,
      username,
      fullName,
      email,
      requestedRole: item.requested_role === 'resident' ? 'resident' : item.requested_role as Role,
      currentRole: requester?.role ?? 'resident',
      company: item.company ?? requester?.companyName ?? 'Not provided',
      documents: item.documents ?? [],
      date: formatTimestamp(item.created_at),
      status: item.status ?? 'pending',
    }
  })
}

async function loadActorProfiles(
  userIds: Array<string | null>,
): Promise<AuthResult<Record<string, Profile>>> {
  const filteredIds = userIds.filter((userId): userId is string => Boolean(userId))
  return listProfilesByIds(filteredIds)
}

async function buildDashboardData(
  userId: string | null,
  role: Role | null,
): Promise<AuthResult<DashboardData>> {
  const emptyData = createEmptyDashboardData()

  const [eventsResult, casesResult, assetsResult, observationsResult] =
    await Promise.all([
      eventService.list(role, userId),
      caseService.list(role, userId),
      assetService.list(role, userId),
      observationService.list(role, userId),
    ])

  const firstError =
    eventsResult.error ||
    casesResult.error ||
    assetsResult.error ||
    observationsResult.error

  if (firstError) {
    return {
      data: emptyData,
      error: firstError,
    }
  }

  const events = eventsResult.data ?? []
  const cases = casesResult.data ?? []
  const assets = assetsResult.data ?? []
  const observations = observationsResult.data ?? []
  const shouldLoadAdminProfiles = role === 'admin'
  const shouldLoadTotalUsers = role === 'admin'
  const shouldLoadCurrentProfile = role === 'industrialist' && Boolean(userId)
  const shouldLoadRoleRequests = role === 'admin'

  const roleRequestsResult = shouldLoadRoleRequests
    ? await adminService.listRoleRequests()
    : { data: [], error: null }

  if (roleRequestsResult.error) {
    return {
      data: emptyData,
      error: roleRequestsResult.error,
    }
  }

  const actorProfilesResult = shouldLoadAdminProfiles
    ? await loadActorProfiles([
        ...cases.map((item) => item.createdBy),
        ...observations.map((item) => item.createdBy),
        ...(roleRequestsResult.data ?? []).map((item) => item.user_id),
      ])
    : { data: {}, error: null }

  if (actorProfilesResult.error) {
    return {
      data: emptyData,
      error: actorProfilesResult.error,
    }
  }

  const totalUsersResult = shouldLoadTotalUsers
    ? await countProfiles()
    : { data: 0, error: null }

  if (totalUsersResult.error) {
    return {
      data: emptyData,
      error: totalUsersResult.error,
    }
  }

  const currentProfileResult = shouldLoadCurrentProfile && userId
    ? await getProfile(userId)
    : { data: null, error: null }

  if (currentProfileResult.error) {
    return {
      data: emptyData,
      error: currentProfileResult.error,
    }
  }

  const profilesMap = actorProfilesResult.data ?? {}
  const totalUsers = totalUsersResult.data ?? 0

  return {
    data: {
      dashboard: {
        events: buildDashboardEvents(events),
      },
      developer: {
        objects: buildConstructionObjects(assets),
      },
      akimat: {
        quickStats: buildQuickStats(assets, cases, events, observations),
        recentActivity: buildRecentActivity(events, cases),
      },
      industrialist: {
        companyInfo: {
          name:
            currentProfileResult.data?.companyName ||
            currentProfileResult.data?.fullName ||
            'Industrial Account',
          avatar: currentProfileResult.data?.avatarUrl ?? '',
          notifications: cases.filter((item) => item.status === 'open').length,
        },
      },
      utilities: {
        chartTypes: utilitiesChartTypes,
      },
      admin: {
        totalUsers,
        featureRequests: buildFeatureRequests(cases, events, profilesMap),
        locationRequests: buildLocationRequests(observations, profilesMap),
        roleRequests: buildRoleRequests(roleRequestsResult.data, profilesMap),
      },
    },
    error: null,
  }
}

export async function getDashboardData({
  userId,
  role,
}: DashboardDataOptions = {}): Promise<AuthResult<DashboardData>> {
  try {
    return await buildDashboardData(userId ?? null, role ?? null)
  } catch (error) {
    const normalizedError = toError(error)
    logger.error(normalizedError, 'dashboard-data.load')

    return {
      data: createEmptyDashboardData(),
      error: normalizedError,
    }
  }
}
