import { assetService } from '@/services/domain/assetService'
import { adminService } from '@/services/domain/adminService'
import { caseService } from '@/services/domain/caseService'
import { eventService } from '@/services/domain/eventService'
import { locationService } from '@/services/domain/locationService'
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
  AkimatCameraFeed,
  AkimatFacility,
  AkimatActivity,
  AkimatMapMarker,
  AkimatProfileSummary,
  AkimatQuickStat,
  AkimatReportsSummary,
  AkimatRequestOverview,
  AkimatStatistics,
  AkimatStreetTraffic,
  AkimatSurveillanceSummary,
  AkimatUtilityMetricPoint,
  AkimatZoneMetric,
  CitizenRequest,
  CitizenRequestStatus,
  ConstructionObject,
  DashboardData,
  DashboardEvent,
  FeatureRequest,
  LocationRequest,
  RoleRequest,
  UtilitiesChartTypeOption,
} from '@/types/dashboard'
import type { EventItem } from '@/types/event'
import type { LocationItem } from '@/types/location'
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
      requestOverview: {
        complaints: 0,
        suggestions: 0,
        letters: 0,
        total: 0,
      },
      surveillanceSummary: {
        online: 0,
        offline: 0,
        maintenance: 0,
        total: 0,
      },
      reportsSummary: {
        developer: 0,
        utilities: 0,
        industrialist: 0,
        total: 0,
      },
      citizenRequests: [],
      cameras: [],
      facilities: [],
      mapMarkers: [],
      statistics: {
        utilitySummary: {
          events: 0,
          cases: 0,
          observations: 0,
        },
        utilityMonthly: [],
        utilityByZone: [],
        industrialSummary: {
          facilities: 0,
          issues: 0,
          observations: 0,
        },
        industrialMonthly: [],
        trafficSummary: {
          incidents: 0,
          observations: 0,
          activeLocations: 0,
        },
        trafficMonthly: [],
        trafficByStreet: [],
      },
      notifications: 0,
      profile: {
        name: 'Akimat Administrator',
        email: 'admin@alatau.gov.kz',
        avatar: '',
      },
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

function normalizeRequestStatus(status: CaseItem['status']): CitizenRequestStatus {
  switch (status) {
    case 'in_progress':
      return 'in-progress'
    case 'resolved':
    case 'closed':
      return 'resolved'
    case 'rejected':
      return 'rejected'
    default:
      return 'pending'
  }
}

function classifyCitizenRequestType(eventType: string | undefined): CitizenRequest['type'] {
  const normalizedType = (eventType ?? '').toLowerCase()

  if (['suggestion', 'improvement', 'proposal'].includes(normalizedType)) {
    return 'suggestion'
  }

  if (['letter', 'thanks', 'gratitude', 'inquiry'].includes(normalizedType)) {
    return 'letter'
  }

  return 'complaint'
}

function getMonthKey(value: string | null) {
  if (!value) {
    return 'Unknown'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return date.toLocaleString('en-US', { month: 'short' })
}

function incrementCounter(source: Record<string, number>, key: string) {
  source[key] = (source[key] ?? 0) + 1
}

function buildCitizenRequests(
  cases: CaseItem[],
  events: EventItem[],
  profilesMap: Record<string, Profile>,
): CitizenRequest[] {
  return cases.slice(0, 20).map((item) => {
    const relatedEvent = events.find((event) => event.id === item.eventId)
    const requestType = classifyCitizenRequestType(relatedEvent?.eventType)

    return {
      id: item.id,
      type: requestType,
      subject: relatedEvent?.title || `Case ${item.id.slice(0, 8)}`,
      message:
        relatedEvent?.description ||
        `Case assigned to ${item.assignedRole ?? 'unassigned'} role.`,
      from: actorName(profilesMap, item.createdBy, 'Citizen'),
      address: relatedEvent?.locationName ?? 'Unknown location',
      date: formatTimestamp(item.createdAt),
      status: normalizeRequestStatus(item.status),
      category: relatedEvent?.eventType ?? item.assignedRole ?? 'General',
    }
  })
}

function buildRequestOverview(requests: CitizenRequest[]): AkimatRequestOverview {
  return requests.reduce<AkimatRequestOverview>(
    (summary, request) => {
      const summaryKey =
        request.type === 'complaint'
          ? 'complaints'
          : request.type === 'suggestion'
            ? 'suggestions'
            : 'letters'
      incrementCounter(summary, summaryKey)
      summary.total += 1
      return summary
    },
    {
      complaints: 0,
      suggestions: 0,
      letters: 0,
      total: 0,
    },
  )
}

function mapCameraType(type: string): AkimatCameraFeed['type'] {
  const normalized = type.toLowerCase()

  if (normalized.includes('road') || normalized.includes('traffic')) {
    return 'road'
  }

  if (normalized.includes('yard') || normalized.includes('court')) {
    return 'courtyard'
  }

  if (normalized.includes('building') || normalized.includes('lobby')) {
    return 'building'
  }

  return 'street'
}

function mapCameraStatus(status: string): AkimatCameraFeed['status'] {
  const normalized = status.toLowerCase()

  if (normalized.includes('offline') || normalized.includes('inactive')) {
    return 'offline'
  }

  if (normalized.includes('maintenance')) {
    return 'maintenance'
  }

  return 'online'
}

function buildCameraFeeds(assets: AssetItem[]): AkimatCameraFeed[] {
  return assets
    .filter((asset) => asset.type.toLowerCase().includes('camera'))
    .map((asset) => {
      const cameraType = mapCameraType(asset.type)
      return {
        id: asset.id,
        name: `${asset.locationName ?? 'City'} ${cameraType} camera`,
        location: asset.locationName ?? 'Unknown location',
        type: cameraType,
        status: mapCameraStatus(asset.status),
        thumbnail: cameraType,
      }
    })
}

function buildSurveillanceSummary(cameras: AkimatCameraFeed[]): AkimatSurveillanceSummary {
  return cameras.reduce(
    (summary, camera) => {
      incrementCounter(summary, camera.status)
      summary.total += 1
      return summary
    },
    {
      online: 0,
      offline: 0,
      maintenance: 0,
      total: 0,
    },
  )
}

function mapFacilityType(type: string): AkimatFacility['type'] {
  const normalized = type.toLowerCase()

  if (normalized.includes('residential') || normalized.includes('housing')) {
    return 'residential'
  }

  if (normalized.includes('industrial') || normalized.includes('factory')) {
    return 'industrial'
  }

  if (normalized.includes('public') || normalized.includes('school') || normalized.includes('park')) {
    return 'public'
  }

  return 'commercial'
}

function mapFacilityStatus(status: string): AkimatFacility['status'] {
  const normalized = status.toLowerCase()

  if (normalized.includes('complete') || normalized.includes('resolved')) {
    return 'completed'
  }

  if (normalized.includes('delay')) {
    return 'delayed'
  }

  if (normalized.includes('plan')) {
    return 'planning'
  }

  return 'in-progress'
}

function buildFacilities(
  assets: AssetItem[],
  profilesMap: Record<string, Profile>,
  cases: CaseItem[],
  events: EventItem[],
  observations: ObservationItem[],
): AkimatFacility[] {
  const eventById = new Map(events.map((item) => [item.id, item]))

  return assets
    .filter((asset) => !asset.type.toLowerCase().includes('camera'))
    .slice(0, 20)
    .map((asset, index) => {
      const ownerProfile =
        (asset.ownerProfileId && profilesMap[asset.ownerProfileId]) ||
        (asset.createdBy && profilesMap[asset.createdBy]) ||
        null

      const relatedCaseCount = cases.filter((item) => {
        const relatedEvent = item.eventId ? eventById.get(item.eventId) : null
        return relatedEvent?.assetId === asset.id
      }).length

      const relatedObservationCount = observations.filter(
        (item) => item.assetId === asset.id,
      ).length

      const createdAt = asset.createdAt ? new Date(asset.createdAt) : new Date()
      const deadline = new Date(createdAt)
      deadline.setDate(deadline.getDate() + 90)

      return {
        id: asset.id,
        name: `${asset.type.charAt(0).toUpperCase()}${asset.type.slice(1)} Facility`,
        developer: ownerProfile?.companyName || ownerProfile?.fullName || 'Unassigned developer',
        developerContact: {
          phone: ownerProfile?.phone || 'Not provided',
          email: ownerProfile?.email || 'unknown@system.local',
        },
        address: asset.locationName ?? 'Unknown location',
        type: mapFacilityType(asset.type),
        status: mapFacilityStatus(asset.status),
        progress:
          mapFacilityStatus(asset.status) === 'completed'
            ? 100
            : mapFacilityStatus(asset.status) === 'planning'
              ? 15
              : mapFacilityStatus(asset.status) === 'delayed'
                ? 35
                : 55 + (index % 4) * 10,
        deadline: deadline.toISOString().slice(0, 10),
        startDate: createdAt.toISOString().slice(0, 10),
        details: `Tracked ${asset.type} facility linked to ${asset.locationName ?? 'city records'}.`,
        reports: relatedCaseCount + relatedObservationCount,
        lastUpdate: formatTimestamp(asset.updatedAt, 'No updates'),
      }
    })
}

function buildMapMarkers(
  facilities: AkimatFacility[],
  cameras: AkimatCameraFeed[],
  cases: CaseItem[],
  events: EventItem[],
  assets: AssetItem[],
  observations: ObservationItem[],
): AkimatMapMarker[] {
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]))
  const eventMap = new Map(events.map((event) => [event.id, event]))

  const facilityMarkers = assets
    .filter(
      (asset) =>
        !asset.type.toLowerCase().includes('camera') &&
        asset.latitude !== null &&
        asset.longitude !== null,
    )
    .slice(0, 8)
    .map<AkimatMapMarker>((asset) => ({
      id: asset.id,
      type:
        mapFacilityStatus(asset.status) === 'in-progress' ||
        mapFacilityStatus(asset.status) === 'planning'
          ? 'construction'
          : 'building',
      name: `${asset.type.charAt(0).toUpperCase()}${asset.type.slice(1)} Facility`,
      address: asset.locationName ?? 'Unknown location',
      lat: asset.latitude ?? 43.238949,
      lng: asset.longitude ?? 76.889709,
      status: mapFacilityStatus(asset.status),
      details: `Tracked ${asset.type} facility.`,
    }))

  const issueMarkers = cases
    .slice(0, 8)
    .map<AkimatMapMarker | null>((item) => {
      const relatedEvent = item.eventId ? eventMap.get(item.eventId) : null
      const relatedAsset = relatedEvent?.assetId ? assetMap.get(relatedEvent.assetId) : null
      const latitude = relatedAsset?.latitude
      const longitude = relatedAsset?.longitude

      if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
        return null
      }

      return {
        id: item.id,
        type:
          relatedEvent?.eventType === 'utility'
            ? 'utility-issue'
            : 'problem',
        name: relatedEvent?.title || `Case ${item.id.slice(0, 8)}`,
        address: relatedEvent?.locationName ?? relatedAsset?.locationName ?? 'Unknown location',
        lat: latitude,
        lng: longitude,
        status: item.status,
        details: relatedEvent?.description || `Assigned to ${item.assignedRole ?? 'unassigned'} role.`,
        date: formatTimestamp(item.createdAt),
      }
    })
    .filter((item): item is AkimatMapMarker => Boolean(item))

  const observationMarkers = observations
    .slice(0, Math.max(0, 8 - issueMarkers.length))
    .map<AkimatMapMarker | null>((item) => {
      const relatedAsset = item.assetId ? assetMap.get(item.assetId) : null
      const latitude = relatedAsset?.latitude
      const longitude = relatedAsset?.longitude

      if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
        return null
      }

      return {
        id: item.id,
        type: 'utility-issue',
        name: `Observation ${item.id.slice(0, 8)}`,
        address: item.locationName ?? relatedAsset?.locationName ?? 'Unknown location',
        lat: latitude,
        lng: longitude,
        status: item.reviewStatus,
        details: 'Observation submitted to city administration.',
        date: formatTimestamp(item.timestamp),
      }
    })
    .filter((item): item is AkimatMapMarker => Boolean(item))

  return [...facilityMarkers, ...issueMarkers, ...observationMarkers].slice(0, 16)
}

function buildReportsSummary(
  facilities: AkimatFacility[],
  observations: ObservationItem[],
): AkimatReportsSummary {
  const developer = facilities.filter((facility) =>
    facility.developer.toLowerCase() !== 'unassigned developer',
  ).length
  const utilities = observations.filter((item) =>
    JSON.stringify(item.payload).toLowerCase().includes('utility'),
  ).length
  const industrialist = facilities.filter((facility) => facility.type === 'industrial').length

  return {
    developer,
    utilities,
    industrialist,
    total: developer + utilities + industrialist,
  }
}

function buildAkimatProfileSummary(profile: Profile | null): AkimatProfileSummary {
  return {
    name: profile?.fullName || 'Akimat Administrator',
    email: profile?.email || 'admin@alatau.gov.kz',
    avatar: profile?.avatarUrl || '',
  }
}

function buildAkimatNotifications(
  citizenRequests: CitizenRequest[],
  cameras: AkimatCameraFeed[],
  observations: ObservationItem[],
): number {
  const pendingRequests = citizenRequests.filter((item) => item.status === 'pending').length
  const offlineCameras = cameras.filter((item) => item.status !== 'online').length
  const pendingObservations = observations.filter((item) => item.reviewStatus === 'pending').length
  return pendingRequests + offlineCameras + pendingObservations
}

function getLocationZone(locationId: string | null, locationsMap: Record<string, LocationItem>) {
  if (!locationId) {
    return 'Unknown'
  }

  return locationsMap[locationId]?.zone ?? 'Unknown'
}

function buildUtilityStatistics(
  events: EventItem[],
  cases: CaseItem[],
  observations: ObservationItem[],
  locationsMap: Record<string, LocationItem>,
): Pick<AkimatStatistics, 'utilitySummary' | 'utilityMonthly' | 'utilityByZone'> {
  const utilityEvents = events.filter((item) => item.eventType.toLowerCase().includes('utility'))
  const utilityCases = cases.filter((item) => item.assignedRole === 'utilities')
  const utilityObservations = observations.filter((item) =>
    JSON.stringify(item.payload).toLowerCase().includes('utility'),
  )

  const monthlyMap = new Map<string, AkimatUtilityMetricPoint>()
  const zoneMap = new Map<string, AkimatZoneMetric>()

  for (const event of utilityEvents) {
    const period = getMonthKey(event.createdAt)
    const zone = getLocationZone(event.locationId, locationsMap)
    monthlyMap.set(period, monthlyMap.get(period) ?? { period, events: 0, cases: 0, observations: 0 })
    zoneMap.set(zone, zoneMap.get(zone) ?? { zone, facilities: 0, issues: 0, cameras: 0 })
    monthlyMap.get(period)!.events += 1
    zoneMap.get(zone)!.issues += 1
  }

  for (const item of utilityCases) {
    const period = getMonthKey(item.createdAt)
    monthlyMap.set(period, monthlyMap.get(period) ?? { period, events: 0, cases: 0, observations: 0 })
    monthlyMap.get(period)!.cases += 1
  }

  for (const item of utilityObservations) {
    const period = getMonthKey(item.timestamp)
    const zone = getLocationZone(item.locationId, locationsMap)
    monthlyMap.set(period, monthlyMap.get(period) ?? { period, events: 0, cases: 0, observations: 0 })
    zoneMap.set(zone, zoneMap.get(zone) ?? { zone, facilities: 0, issues: 0, cameras: 0 })
    monthlyMap.get(period)!.observations += 1
    zoneMap.get(zone)!.issues += 1
  }

  return {
    utilitySummary: {
      events: utilityEvents.length,
      cases: utilityCases.length,
      observations: utilityObservations.length,
    },
    utilityMonthly: Array.from(monthlyMap.values()),
    utilityByZone: Array.from(zoneMap.values()),
  }
}

function buildIndustrialStatistics(
  facilities: AkimatFacility[],
  observations: ObservationItem[],
): Pick<AkimatStatistics, 'industrialSummary' | 'industrialMonthly'> {
  const industrialFacilities = facilities.filter((item) => item.type === 'industrial')
  const industrialObservations = observations.filter((item) =>
    JSON.stringify(item.payload).toLowerCase().includes('industrial'),
  )
  const monthlyMap = new Map<string, AkimatStatistics['industrialMonthly'][number]>()

  for (const facility of industrialFacilities) {
    const period = getMonthKey(facility.startDate)
    monthlyMap.set(period, monthlyMap.get(period) ?? { period, facilities: 0, issues: 0, observations: 0 })
    monthlyMap.get(period)!.facilities += 1
    if (facility.status === 'delayed') {
      monthlyMap.get(period)!.issues += 1
    }
  }

  for (const item of industrialObservations) {
    const period = getMonthKey(item.timestamp)
    monthlyMap.set(period, monthlyMap.get(period) ?? { period, facilities: 0, issues: 0, observations: 0 })
    monthlyMap.get(period)!.observations += 1
  }

  return {
    industrialSummary: {
      facilities: industrialFacilities.length,
      issues: industrialFacilities.filter((item) => item.status === 'delayed').length,
      observations: industrialObservations.length,
    },
    industrialMonthly: Array.from(monthlyMap.values()),
  }
}

function buildTrafficStatistics(
  events: EventItem[],
  observations: ObservationItem[],
  locationsMap: Record<string, LocationItem>,
): Pick<AkimatStatistics, 'trafficSummary' | 'trafficMonthly' | 'trafficByStreet'> {
  const trafficEvents = events.filter((item) =>
    ['traffic', 'road', 'transport'].some((keyword) =>
      item.eventType.toLowerCase().includes(keyword),
    ),
  )

  const trafficObservations = observations.filter((item) =>
    JSON.stringify(item.payload).toLowerCase().includes('traffic'),
  )

  const monthlyMap = new Map<string, AkimatStatistics['trafficMonthly'][number]>()
  const streetMap = new Map<string, AkimatStreetTraffic>()

  for (const event of trafficEvents) {
    const period = getMonthKey(event.createdAt)
    const locationName = event.locationName ?? 'Unknown street'
    monthlyMap.set(period, monthlyMap.get(period) ?? { period, incidents: 0, observations: 0 })
    streetMap.set(
      locationName,
      streetMap.get(locationName) ?? {
        name: locationName,
        congestion: 30,
        avgSpeed: 45,
        incidents: 0,
      },
    )
    monthlyMap.get(period)!.incidents += 1
    streetMap.get(locationName)!.incidents += 1
  }

  for (const item of trafficObservations) {
    const period = getMonthKey(item.timestamp)
    const locationName = item.locationName ?? 'Unknown street'
    monthlyMap.set(period, monthlyMap.get(period) ?? { period, incidents: 0, observations: 0 })
    streetMap.set(
      locationName,
      streetMap.get(locationName) ?? {
        name: locationName,
        congestion: 30,
        avgSpeed: 45,
        incidents: 0,
      },
    )
    monthlyMap.get(period)!.observations += 1
    streetMap.get(locationName)!.congestion = Math.min(
      95,
      streetMap.get(locationName)!.congestion + 8,
    )
    streetMap.get(locationName)!.avgSpeed = Math.max(
      15,
      streetMap.get(locationName)!.avgSpeed - 3,
    )
  }

  return {
    trafficSummary: {
      incidents: trafficEvents.length,
      observations: trafficObservations.length,
      activeLocations: new Set(
        [...trafficEvents.map((item) => item.locationId), ...trafficObservations.map((item) => item.locationId)].filter(Boolean),
      ).size,
    },
    trafficMonthly: Array.from(monthlyMap.values()),
    trafficByStreet: Array.from(streetMap.values()),
  }
}

function buildAkimatStatistics(
  events: EventItem[],
  cases: CaseItem[],
  observations: ObservationItem[],
  facilities: AkimatFacility[],
  cameras: AkimatCameraFeed[],
  locations: LocationItem[],
): AkimatStatistics {
  const locationsMap = locations.reduce<Record<string, LocationItem>>((accumulator, item) => {
    accumulator[item.id] = item
    return accumulator
  }, {})

  const utilityStats = buildUtilityStatistics(events, cases, observations, locationsMap)
  const industrialStats = buildIndustrialStatistics(facilities, observations)
  const trafficStats = buildTrafficStatistics(events, observations, locationsMap)

  const utilityByZoneMap = new Map<string, AkimatZoneMetric>(
    utilityStats.utilityByZone.map((item) => [item.zone, item]),
  )

  for (const location of locations) {
    if (!utilityByZoneMap.has(location.zone)) {
      utilityByZoneMap.set(location.zone, {
        zone: location.zone,
        facilities: 0,
        issues: 0,
        cameras: 0,
      })
    }
  }

  for (const facility of facilities) {
    const location = locations.find((item) => item.name === facility.address || facility.address.includes(item.name))
    if (location) {
      utilityByZoneMap.get(location.zone)!.facilities += 1
    }
  }

  for (const camera of cameras) {
    const location = locations.find((item) => camera.location.includes(item.name))
    if (location) {
      utilityByZoneMap.get(location.zone)!.cameras += 1
    }
  }

  return {
    utilitySummary: utilityStats.utilitySummary,
    utilityMonthly: utilityStats.utilityMonthly,
    utilityByZone: Array.from(utilityByZoneMap.values()),
    industrialSummary: industrialStats.industrialSummary,
    industrialMonthly: industrialStats.industrialMonthly,
    trafficSummary: trafficStats.trafficSummary,
    trafficMonthly: trafficStats.trafficMonthly,
    trafficByStreet: trafficStats.trafficByStreet,
  }
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

  const [eventsResult, casesResult, assetsResult, observationsResult, locationsResult] =
    await Promise.all([
      eventService.list(role, userId),
      caseService.list(role, userId),
      assetService.list(role, userId),
      observationService.list(role, userId),
      locationService.list(),
    ])

  const firstError =
    eventsResult.error ||
    casesResult.error ||
    assetsResult.error ||
    observationsResult.error ||
    locationsResult.error

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
  const locations = locationsResult.data ?? []
  const shouldLoadAdminProfiles = role === 'admin'
  const shouldLoadTotalUsers = role === 'admin'
  const shouldLoadCurrentProfile =
    (role === 'industrialist' || role === 'akimat') && Boolean(userId)
  const shouldLoadRoleRequests = role === 'admin'
  const shouldLoadAkimatProfiles = role === 'akimat'

  const roleRequestsResult = shouldLoadRoleRequests
    ? await adminService.listRoleRequests()
    : { data: [], error: null }

  if (roleRequestsResult.error) {
    return {
      data: emptyData,
      error: roleRequestsResult.error,
    }
  }

  const actorProfilesResult = shouldLoadAdminProfiles || shouldLoadAkimatProfiles
    ? await loadActorProfiles([
        ...cases.map((item) => item.createdBy),
        ...observations.map((item) => item.createdBy),
        ...assets.map((item) => item.ownerProfileId),
        ...assets.map((item) => item.createdBy),
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
  const akimatCitizenRequests = buildCitizenRequests(cases, events, profilesMap)
  const akimatCameraFeeds = buildCameraFeeds(assets)
  const akimatFacilities = buildFacilities(
    assets,
    profilesMap,
    cases,
    events,
    observations,
  )
  const akimatMapMarkers = buildMapMarkers(
    akimatFacilities,
    akimatCameraFeeds,
    cases,
    events,
    assets,
    observations,
  )
  const akimatStatistics = buildAkimatStatistics(
    events,
    cases,
    observations,
    akimatFacilities,
    akimatCameraFeeds,
    locations,
  )
  const akimatProfile = buildAkimatProfileSummary(currentProfileResult.data)

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
        requestOverview: buildRequestOverview(akimatCitizenRequests),
        surveillanceSummary: buildSurveillanceSummary(akimatCameraFeeds),
        reportsSummary: buildReportsSummary(akimatFacilities, observations),
        citizenRequests: akimatCitizenRequests,
        cameras: akimatCameraFeeds,
        facilities: akimatFacilities,
        mapMarkers: akimatMapMarkers,
        statistics: akimatStatistics,
        notifications: buildAkimatNotifications(
          akimatCitizenRequests,
          akimatCameraFeeds,
          observations,
        ),
        profile: akimatProfile,
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
