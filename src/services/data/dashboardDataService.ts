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
  DashboardAppeal,
  DashboardEvent,
  DashboardLocationOption,
  DashboardMapMarker,
  DashboardNewsItem,
  DashboardSituation,
  FeatureRequest,
  IndustrialistEmissionsData,
  IndustrialistFinancesData,
  IndustrialistIncident,
  IndustrialistMetricCard,
  IndustrialistNotification,
  IndustrialistProductLine,
  IndustrialistProductionData,
  IndustrialistQuarterlyComparison,
  IndustrialistTransaction,
  IndustrialistWeeklyShiftPoint,
  LocationRequest,
  RoleRequest,
  UtilitiesChartTypeOption,
  UtilitiesDistrictMetric,
  UtilitiesOperationalEvent,
  UtilitiesReportTarget,
  UtilitiesResourceKey,
  UtilitiesResourceMetrics,
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

const industrialistChartColors = [
  'oklch(0.75 0.15 195)',
  'oklch(0.65 0.15 160)',
  'oklch(0.7 0.15 60)',
  'oklch(0.6 0.15 300)',
]

function createEmptyDashboardData(): DashboardData {
  return {
    dashboard: {
      events: [],
      appeals: [],
      news: [],
      situations: [],
      locationOptions: [],
      mapMarkers: [],
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
      notifications: [],
      emissions: {
        stats: [],
        monthly: [],
        breakdown: [],
        incidents: [],
      },
      production: {
        stats: [],
        monthly: [],
        productLines: [],
        weekly: [],
        workforce: {
          totalWorkers: 0,
          productionLines: 0,
          activeShifts: 0,
          capacityUsed: 0,
        },
      },
      finances: {
        stats: [],
        monthly: [],
        expenseBreakdown: [],
        quarterly: [],
        transactions: [],
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          totalProfit: 0,
          taxesPaid: 0,
        },
      },
    },
    utilities: {
      chartTypes: utilitiesChartTypes,
      resources: {
        electricity: {
          unit: 'kWh',
          currentValue: 0,
          previousValue: 0,
          efficiency: 0,
          cost: 0,
          monthly: [],
          peakHours: '18:00 - 21:00',
          activeConnections: 0,
          avgDailyUsage: '0 kWh',
        },
        water: {
          unit: 'm3',
          currentValue: 0,
          previousValue: 0,
          efficiency: 0,
          cost: 0,
          monthly: [],
          peakHours: '18:00 - 21:00',
          activeConnections: 0,
          avgDailyUsage: '0 m3',
        },
        gas: {
          unit: 'm3',
          currentValue: 0,
          previousValue: 0,
          efficiency: 0,
          cost: 0,
          monthly: [],
          peakHours: '18:00 - 21:00',
          activeConnections: 0,
          avgDailyUsage: '0 m3',
        },
        transport: {
          unit: 'trips',
          currentValue: 0,
          previousValue: 0,
          efficiency: 0,
          cost: 0,
          monthly: [],
          peakHours: '18:00 - 21:00',
          activeConnections: 0,
          avgDailyUsage: '0 trips',
        },
      },
      events: [],
      districts: [],
      reportTargets: [],
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

function buildDashboardAppeals(
  cases: CaseItem[],
  events: EventItem[],
): DashboardAppeal[] {
  return cases.slice(0, 12).map((item) => {
    const relatedEvent = events.find((event) => event.id === item.eventId)

    return {
      id: item.id,
      category: relatedEvent?.eventType ?? item.assignedRole ?? 'general',
      message:
        relatedEvent?.description ||
        `Appeal assigned to ${item.assignedRole ?? 'unassigned'} role.`,
      date: formatTimestamp(item.createdAt),
      status:
        item.status === 'resolved' || item.status === 'closed'
          ? 'resolved'
          : item.status === 'in_progress'
            ? 'in-progress'
            : 'pending',
    }
  })
}

function buildDashboardNews(events: EventItem[]): DashboardNewsItem[] {
  return events.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.description || `${item.eventType} update from Alatau Smart City.`,
    date: formatTimestamp(item.createdAt),
    category: item.eventType.replace(/_/g, ' '),
  }))
}

function buildDashboardSituations(
  events: EventItem[],
  cases: CaseItem[],
): DashboardSituation[] {
  return events
    .filter((item) => item.severity !== 'low')
    .slice(0, 8)
    .map((item) => {
      const relatedCase = cases.find((currentCase) => currentCase.eventId === item.id)

      return {
        id: item.id,
        title: item.title,
        description:
          item.description ||
          `Operational situation detected at ${item.locationName ?? 'Alatau Smart City'}.`,
        severity:
          item.severity === 'critical' || item.severity === 'high'
            ? 'high'
            : item.severity === 'medium'
              ? 'medium'
              : 'low',
        date: formatTimestamp(relatedCase?.updatedAt || item.createdAt),
      }
    })
}

function buildDashboardLocationOptions(
  locations: LocationItem[],
): DashboardLocationOption[] {
  return locations.map((location) => ({
    id: location.id,
    name: location.name,
  }))
}

function buildDashboardMapMarkers(
  locations: LocationItem[],
  assets: AssetItem[],
  events: EventItem[],
  observations: ObservationItem[],
): DashboardMapMarker[] {
  const baseLayout = [
    { x: 24, y: 28 },
    { x: 62, y: 42 },
    { x: 36, y: 56 },
    { x: 74, y: 30 },
    { x: 48, y: 66 },
    { x: 18, y: 72 },
  ]
  const locationIndex = new Map(
    locations.map((location, index) => [
      location.id,
      baseLayout[index % baseLayout.length],
    ]),
  )

  const eventMarkers = events.slice(0, 6).map<DashboardMapMarker>((event, index) => {
    const position =
      (event.locationId && locationIndex.get(event.locationId)) ||
      baseLayout[index % baseLayout.length]

    return {
      id: `event-${event.id}`,
      type: 'event',
      x: position.x,
      y: position.y,
      label: event.title,
      details: {
        title: event.title,
        description: event.description,
        eventDate: formatTimestamp(event.startsAt ?? event.createdAt),
        status: event.severity,
      },
    }
  })

  const placeMarkers = observations
    .filter((item) => item.payload.category === 'community_place')
    .slice(0, 6)
    .map<DashboardMapMarker>((item, index) => {
      const position =
        (item.locationId && locationIndex.get(item.locationId)) ||
        baseLayout[(index + 2) % baseLayout.length]
      const name =
        typeof item.payload.name === 'string' ? item.payload.name : `Place ${item.id.slice(0, 8)}`
      const description =
        typeof item.payload.description === 'string' ? item.payload.description : 'Community place suggestion'

      return {
        id: `place-${item.id}`,
        type: 'place',
        x: position.x,
        y: position.y,
        label: name,
        details: {
          title: name,
          description,
          status: item.reviewStatus,
        },
      }
    })

  const buildingMarkers = assets.slice(0, 6).map<DashboardMapMarker>((asset, index) => {
    const position =
      (asset.locationId && locationIndex.get(asset.locationId)) ||
      baseLayout[(index + 1) % baseLayout.length]
    const title = asset.name || `${asset.type} object`

    return {
      id: `asset-${asset.id}`,
      type: 'building',
      x: position.x,
      y: position.y,
      label: title,
      details: {
        title,
        description:
          asset.description || `Tracked ${asset.type} object in Alatau Smart City.`,
        status: asset.status,
      },
    }
  })

  return [...buildingMarkers, ...placeMarkers, ...eventMarkers].slice(0, 18)
}

function normalizeConstructionStatus(status: string): ConstructionObject['status'] {
  const normalized = status.toLowerCase()

  if (normalized.includes('complete')) {
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

function isDeveloperProjectAsset(asset: AssetItem) {
  const normalizedType = asset.type.toLowerCase()
  const operationalKeywords = ['camera', 'traffic_light', 'traffic light', 'sensor', 'generic']

  if (operationalKeywords.some((keyword) => normalizedType.includes(keyword))) {
    return false
  }

  return true
}

function buildConstructionObjects(
  assets: AssetItem[],
  events: EventItem[],
  cases: CaseItem[],
  profilesMap: Record<string, Profile>,
  currentProfile: Profile | null,
): ConstructionObject[] {
  return assets
    .filter(isDeveloperProjectAsset)
    .slice(0, 20)
    .map((asset) => {
      const createdAt = asset.createdAt ? new Date(asset.createdAt) : new Date()
    const fallbackDeadline = new Date(createdAt)
    fallbackDeadline.setDate(fallbackDeadline.getDate() + 90)
    const relatedReports = cases
      .filter((item) => {
        const relatedEvent = events.find((event) => event.id === item.eventId)
        return relatedEvent?.assetId === asset.id
      })
      .slice(0, 6)
      .map((item) => {
        const relatedEvent = events.find((event) => event.id === item.eventId)

        return {
          id: item.id,
          title: relatedEvent?.title || `Report ${item.id.slice(0, 8)}`,
          status: item.status.replace('_', ' '),
          date: formatTimestamp(item.createdAt),
        }
      })

    const ownerProfile =
      (asset.ownerProfileId && profilesMap[asset.ownerProfileId]) ||
      (asset.createdBy && profilesMap[asset.createdBy]) ||
      currentProfile

    return {
      id: asset.id,
      locationId: asset.locationId,
      type: asset.type,
      name:
        asset.name ||
        `${asset.type.charAt(0).toUpperCase()}${asset.type.slice(1)} Object`,
      address: asset.address || asset.locationName || 'Unassigned location',
      description:
        asset.description || `Tracked ${asset.type} project in the developer registry.`,
      contactPhone: asset.contactPhone || ownerProfile?.phone || '',
      developerName:
        ownerProfile?.companyName || ownerProfile?.fullName || 'Developer account',
      status: normalizeConstructionStatus(asset.status),
      deadline:
        asset.deadline ||
        fallbackDeadline.toISOString().slice(0, 10),
      progress:
        asset.progress ??
        (normalizeConstructionStatus(asset.status) === 'completed'
          ? 100
          : normalizeConstructionStatus(asset.status) === 'planning'
            ? 15
            : normalizeConstructionStatus(asset.status) === 'delayed'
              ? 35
              : 60),
      coordinates: {
        lat: asset.latitude ?? 43.238949,
        lng: asset.longitude ?? 76.889709,
      },
      reports: relatedReports,
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

function eventSeverityScore(severity: EventItem['severity']) {
  switch (severity) {
    case 'critical':
      return 4
    case 'high':
      return 3
    case 'medium':
      return 2
    default:
      return 1
  }
}

function normalizeIndustrialIncidentStatus(status: CaseItem['status']): IndustrialistIncident['status'] {
  switch (status) {
    case 'in_progress':
      return 'in-progress'
    case 'resolved':
    case 'closed':
      return 'resolved'
    default:
      return 'pending'
  }
}

function normalizeIndustrialIncidentType(eventType: string): IndustrialistIncident['type'] {
  const normalized = eventType.toLowerCase()

  if (normalized.includes('leak')) {
    return 'leak'
  }

  if (normalized.includes('violation')) {
    return 'violation'
  }

  if (normalized.includes('accident')) {
    return 'accident'
  }

  return 'excess'
}

function filterIndustrialEvents(
  events: EventItem[],
  industrialAssetIds: Set<string>,
  userId: string | null,
) {
  return events.filter(
    (item) =>
      (item.assetId && industrialAssetIds.has(item.assetId)) ||
      item.createdBy === userId ||
      item.eventType.toLowerCase().includes('industrial') ||
      item.eventType.toLowerCase().includes('emission') ||
      item.eventType.toLowerCase().includes('production') ||
      item.eventType.toLowerCase().includes('finance'),
  )
}

function filterIndustrialCases(
  cases: CaseItem[],
  industrialEventIds: Set<string>,
  userId: string | null,
) {
  return cases.filter(
    (item) =>
      (item.eventId && industrialEventIds.has(item.eventId)) ||
      item.createdBy === userId,
  )
}

function filterIndustrialObservations(
  observations: ObservationItem[],
  industrialAssetIds: Set<string>,
  industrialCaseIds: Set<string>,
  userId: string | null,
) {
  return observations.filter(
    (item) =>
      (item.assetId && industrialAssetIds.has(item.assetId)) ||
      (item.caseId && industrialCaseIds.has(item.caseId)) ||
      item.createdBy === userId ||
      JSON.stringify(item.payload).toLowerCase().includes('industrial'),
  )
}

function buildIndustrialIncidents(
  cases: CaseItem[],
  events: EventItem[],
): IndustrialistIncident[] {
  const eventMap = new Map(events.map((item) => [item.id, item]))

  return cases
    .filter((item) => {
      const relatedEvent = item.eventId ? eventMap.get(item.eventId) : null
      return relatedEvent && (
        relatedEvent.eventType.toLowerCase().includes('industrial') ||
        relatedEvent.eventType.toLowerCase().includes('emission') ||
        relatedEvent.eventType.toLowerCase().includes('production') ||
        relatedEvent.eventType.toLowerCase().includes('finance')
      )
    })
    .map((item) => {
      const relatedEvent = item.eventId ? eventMap.get(item.eventId) : null
      const description = relatedEvent?.description || 'Industrial incident reported.'
      const consequence =
        description.split('.').find((part) => part.trim().length > 0)?.trim() || description

      return {
        id: item.id,
        type: normalizeIndustrialIncidentType(relatedEvent?.eventType ?? 'industrial_incident'),
        title: relatedEvent?.title || `Industrial incident ${item.id.slice(0, 8)}`,
        date: relatedEvent?.createdAt?.slice(0, 10) || item.createdAt.slice(0, 10),
        severity: relatedEvent?.severity ?? 'medium',
        consequence,
        solution:
          item.status === 'resolved'
            ? 'Resolved and documented in the industrial dashboard.'
            : 'Pending remediation plan and operational follow-up.',
        status: normalizeIndustrialIncidentStatus(item.status),
        reportedToAkimat: Boolean(item.eventId),
        assetId: relatedEvent?.assetId ?? null,
      }
    })
    .slice(0, 20)
}

function buildIndustrialEmissionData(
  events: EventItem[],
  observations: ObservationItem[],
  incidents: IndustrialistIncident[],
): IndustrialistEmissionsData {
  const monthlyMap = new Map<string, IndustrialistEmissionsData['monthly'][number]>()
  const totalSeverity = events.reduce((sum, item) => sum + eventSeverityScore(item.severity), 0)
  const observationWeight = observations.length
  const wasteProcessed = Math.min(100, Math.max(0, 82 + observationWeight * 2))
  const totalCo2 = totalSeverity * 420 + observationWeight * 180
  const totalNox = totalSeverity * 22 + observationWeight * 6
  const totalSo2 = totalSeverity * 9 + observationWeight * 3
  const totalParticles = totalSeverity * 4 + observationWeight * 2

  for (const item of events) {
    const month = getMonthKey(item.createdAt)
    monthlyMap.set(month, monthlyMap.get(month) ?? { month, co2: 0, nox: 0, so2: 0, particles: 0 })
    monthlyMap.get(month)!.co2 += eventSeverityScore(item.severity) * 120
    monthlyMap.get(month)!.nox += eventSeverityScore(item.severity) * 8
    monthlyMap.get(month)!.so2 += eventSeverityScore(item.severity) * 4
    monthlyMap.get(month)!.particles += eventSeverityScore(item.severity) * 2
  }

  for (const item of observations) {
    const month = getMonthKey(item.timestamp)
    monthlyMap.set(month, monthlyMap.get(month) ?? { month, co2: 0, nox: 0, so2: 0, particles: 0 })
    monthlyMap.get(month)!.co2 += 40
    monthlyMap.get(month)!.nox += 3
    monthlyMap.get(month)!.so2 += 2
    monthlyMap.get(month)!.particles += 1
  }

  const stats: IndustrialistMetricCard[] = [
    {
      label: 'Total CO2 (tons/year)',
      value: `${totalCo2.toLocaleString()}`,
      change: incidents.length ? -Math.min(30, incidents.length * 3) : 4,
      subtext: `Observation-backed total`,
    },
    {
      label: 'NOx Emissions (kg/year)',
      value: `${totalNox.toLocaleString()}`,
      change: incidents.length ? -Math.min(20, incidents.length * 2) : 3,
      subtext: `Derived from industrial events`,
    },
    {
      label: 'Waste Processed (%)',
      value: `${wasteProcessed.toFixed(1)}%`,
      change: 2 + observations.length,
      subtext: `${observations.length} industrial observations`,
    },
    {
      label: 'Incidents This Year',
      value: `${incidents.length}`,
      change: incidents.length ? -Math.min(50, incidents.filter((item) => item.status === 'resolved').length * 10) : 0,
      subtext: `${incidents.filter((item) => item.status !== 'resolved').length} open`,
    },
  ]

  const breakdown: IndustrialistEmissionsData['breakdown'] = [
    { name: 'CO2', value: totalCo2, color: industrialistChartColors[0] },
    { name: 'NOx', value: totalNox, color: industrialistChartColors[1] },
    { name: 'SO2', value: totalSo2, color: industrialistChartColors[2] },
    { name: 'Particles', value: totalParticles, color: industrialistChartColors[3] },
  ]

  return {
    stats,
    monthly: Array.from(monthlyMap.values()),
    breakdown,
    incidents,
  }
}

function buildIndustrialProductionData(assets: AssetItem[], events: EventItem[]): IndustrialistProductionData {
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date()
    monthDate.setMonth(monthDate.getMonth() - (5 - index))
    const month = monthDate.toLocaleString('en-US', { month: 'short' })
    const assetFactor = assets.length || 1
    const actual = 8000 + assetFactor * 1200 + index * 550
    const target = 7600 + assetFactor * 1100 + index * 500
    const efficiency = Math.round((actual / Math.max(target, 1)) * 100)

    return { month, actual, target, efficiency }
  })

  const productLines: IndustrialistProductLine[] = assets.slice(0, 4).map((asset, index) => {
    const units = 12000 + (asset.progress ?? 0) * 180 + index * 800
    const target = 13000 + index * 700
    const efficiency = Math.round((units / target) * 1000) / 10

    return {
      id: asset.id,
      name: asset.name || `Industrial Line ${index + 1}`,
      units,
      target,
      efficiency,
      status: efficiency >= 100 ? 'exceeding' : efficiency >= 90 ? 'on-track' : 'behind',
    }
  })

  const weekly: IndustrialistWeeklyShiftPoint[] = [
    { day: 'Mon', shift1: 420, shift2: 380, shift3: 340 },
    { day: 'Tue', shift1: 435, shift2: 395, shift3: 350 },
    { day: 'Wed', shift1: 450, shift2: 405, shift3: 360 },
    { day: 'Thu', shift1: 445, shift2: 398, shift3: 355 },
    { day: 'Fri', shift1: 470, shift2: 420, shift3: 372 },
    { day: 'Sat', shift1: 320, shift2: 280, shift3: 0 },
    { day: 'Sun', shift1: 0, shift2: 0, shift3: 0 },
  ]

  const totalUnits = monthly.reduce((sum, item) => sum + item.actual, 0)
  const avgEfficiency = monthly.length
    ? Math.round((monthly.reduce((sum, item) => sum + item.efficiency, 0) / monthly.length) * 10) / 10
    : 0
  const uptime = Math.max(85, 99 - events.filter((item) => item.severity === 'critical').length * 2)
  const energyPerUnit = totalUnits ? Math.round(((assets.length * 14000) / totalUnits) * 10) / 10 : 0

  return {
    stats: [
      {
        label: 'Total Units (YTD)',
        value: totalUnits.toLocaleString(),
        change: 8 + assets.length,
        subtext: `Target: ${monthly.reduce((sum, item) => sum + item.target, 0).toLocaleString()}`,
      },
      {
        label: 'Avg. Efficiency',
        value: `${avgEfficiency}%`,
        change: 2 + Math.max(0, assets.length - 1),
        subtext: `${productLines.filter((item) => item.status !== 'behind').length} lines on track`,
      },
      {
        label: 'Uptime',
        value: `${uptime}%`,
        change: 1,
        subtext: `${events.length} tracked industrial events`,
      },
      {
        label: 'Energy per Unit',
        value: `${energyPerUnit || 2.4} kWh`,
        change: -4,
        subtext: `Derived from ${assets.length} facilities`,
      },
    ],
    monthly,
    productLines,
    weekly,
    workforce: {
      totalWorkers: 120 + assets.length * 28,
      productionLines: Math.max(assets.length, 1),
      activeShifts: 3,
      capacityUsed: Math.min(100, Math.round(avgEfficiency)),
    },
  }
}

function buildIndustrialFinancesData(
  production: IndustrialistProductionData,
  incidents: IndustrialistIncident[],
): IndustrialistFinancesData {
  const monthly = production.monthly.map((item, index) => {
    const revenue = Math.round(item.actual * 0.028)
    const incidentPenalty = incidents.filter((incident) => incident.status !== 'resolved').length * 4
    const expenses = Math.round(item.target * 0.019 + incidentPenalty + index * 2)
    const profit = revenue - expenses

    return {
      month: item.month,
      revenue,
      expenses,
      profit,
    }
  })

  const totalRevenue = monthly.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = monthly.reduce((sum, item) => sum + item.expenses, 0)
  const totalProfit = monthly.reduce((sum, item) => sum + item.profit, 0)
  const profitMargin = totalRevenue ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0

  const expenseBreakdown = [
    { name: 'Raw Materials', value: 42, amount: Math.round(totalExpenses * 0.42), color: industrialistChartColors[0] },
    { name: 'Labor', value: 28, amount: Math.round(totalExpenses * 0.28), color: industrialistChartColors[1] },
    { name: 'Energy', value: 15, amount: Math.round(totalExpenses * 0.15), color: industrialistChartColors[2] },
    { name: 'Maintenance', value: 8, amount: Math.round(totalExpenses * 0.08), color: industrialistChartColors[3] },
    { name: 'Other', value: 7, amount: Math.round(totalExpenses * 0.07), color: 'oklch(0.55 0.1 30)' },
  ]

  const quarterly: IndustrialistQuarterlyComparison[] = [
    { quarter: 'Q1', current: Math.round(totalRevenue * 0.22), previous: Math.round(totalRevenue * 0.19), growth: 15.8 },
    { quarter: 'Q2', current: Math.round(totalRevenue * 0.24), previous: Math.round(totalRevenue * 0.21), growth: 14.2 },
    { quarter: 'Q3', current: Math.round(totalRevenue * 0.26), previous: Math.round(totalRevenue * 0.22), growth: 18.1 },
    { quarter: 'Q4', current: Math.round(totalRevenue * 0.28), previous: Math.round(totalRevenue * 0.25), growth: 12.6 },
  ]

  const transactions: IndustrialistTransaction[] = monthly
    .flatMap((item, index) => [
      {
        id: `${item.month}-income-${index}`,
        type: 'income' as const,
        description: `${item.month} industrial sales`,
        amount: item.revenue * 1000,
        date: new Date().toISOString().slice(0, 10),
      },
      {
        id: `${item.month}-expense-${index}`,
        type: 'expense' as const,
        description: `${item.month} operational expenses`,
        amount: item.expenses * 1000,
        date: new Date().toISOString().slice(0, 10),
      },
    ])
    .slice(0, 10)

  return {
    stats: [
      {
        label: 'Annual Revenue',
        value: `${(totalRevenue / 1000).toFixed(1)}M KZT`,
        change: 11.4,
        subtext: 'Industrial revenue estimate',
      },
      {
        label: 'Annual Expenses',
        value: `${(totalExpenses / 1000).toFixed(1)}M KZT`,
        change: 6.8,
        subtext: 'Operating and maintenance',
      },
      {
        label: 'Net Profit',
        value: `${(totalProfit / 1000).toFixed(1)}M KZT`,
        change: totalProfit >= 0 ? 13.2 : -4.2,
        subtext: 'Derived from monthly performance',
      },
      {
        label: 'Profit Margin',
        value: `${profitMargin}%`,
        change: 2.1,
        subtext: `${incidents.length} tracked incidents`,
      },
    ],
    monthly,
    expenseBreakdown,
    quarterly,
    transactions,
    summary: {
      totalRevenue,
      totalExpenses,
      totalProfit,
      taxesPaid: Math.round(totalProfit * 0.2),
    },
  }
}

function buildIndustrialNotifications(
  incidents: IndustrialistIncident[],
  cases: CaseItem[],
): IndustrialistNotification[] {
  const incidentNotifications = incidents
    .filter((item) => item.status !== 'resolved')
    .map<IndustrialistNotification>((item) => ({
      id: `incident-${item.id}`,
      title: item.title,
      description: item.reportedToAkimat ? 'Reported to Akimat and awaiting follow-up.' : 'Incident needs escalation to Akimat.',
      date: item.date,
    }))

  const caseNotifications = cases
    .filter((item) => item.status === 'open' || item.status === 'in_progress')
    .slice(0, 8)
    .map<IndustrialistNotification>((item) => ({
      id: `case-${item.id}`,
      title: `Case ${item.id.slice(0, 8)}`,
      description: `Status: ${item.status.replace('_', ' ')}.`,
      date: item.createdAt.slice(0, 10),
    }))

  return [...incidentNotifications, ...caseNotifications]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 12)
}

function normalizeUtilityResource(input: string): UtilitiesResourceKey {
  const normalized = input.toLowerCase()

  if (normalized.includes('water')) return 'water'
  if (normalized.includes('gas')) return 'gas'
  if (normalized.includes('transport') || normalized.includes('bus') || normalized.includes('traffic')) {
    return 'transport'
  }

  return 'electricity'
}

function normalizeUtilityEventType(item: EventItem): UtilitiesOperationalEvent['type'] {
  if (item.severity === 'critical' || item.severity === 'high') {
    return 'alert'
  }

  if (item.description.toLowerCase().includes('maintenance')) {
    return 'opportunity'
  }

  if (item.description.toLowerCase().includes('forecast') || item.description.toLowerCase().includes('predicted')) {
    return 'prediction'
  }

  return 'warning'
}

function buildUtilityEvents(
  events: EventItem[],
  cases: CaseItem[],
): UtilitiesOperationalEvent[] {
  const caseByEventId = new Map(
    cases
      .filter((item) => item.eventId)
      .map((item) => [item.eventId as string, item]),
  )

  return events.map((item) => {
    const relatedCase = caseByEventId.get(item.id)
    const resource = normalizeUtilityResource(
      `${item.title} ${item.eventType} ${item.description}`,
    )
    const predictedChange =
      item.severity === 'critical'
        ? 24
        : item.severity === 'high'
          ? 16
          : item.severity === 'medium'
            ? 9
            : 4

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      type: normalizeUtilityEventType(item),
      resource,
      impact:
        item.severity === 'critical' || item.severity === 'high'
          ? 'high'
          : item.severity === 'medium'
            ? 'medium'
            : 'low',
      predictedChange,
      date: item.createdAt.slice(0, 10),
      location: item.locationName ?? 'Unknown location',
      status:
        relatedCase?.status === 'resolved' || relatedCase?.status === 'closed'
          ? 'resolved'
          : relatedCase?.status === 'in_progress'
            ? 'in-progress'
            : 'pending',
    }
  })
}

function buildUtilitiesDistricts(
  locations: LocationItem[],
  observations: ObservationItem[],
): UtilitiesDistrictMetric[] {
  return locations.map((location) => {
    const matchingObservations = observations.filter(
      (item) => item.locationId === location.id,
    )
    const consumption = Math.max(
      12,
      Math.min(98, 35 + matchingObservations.length * 12),
    )

    return {
      id: location.id,
      name: location.name,
      consumption,
    }
  })
}

function buildUtilitiesResources(
  events: EventItem[],
  observations: ObservationItem[],
  assets: AssetItem[],
): Record<UtilitiesResourceKey, UtilitiesResourceMetrics> {
  const base = {
    electricity: {
      unit: 'kWh',
      avgDailyUsage: '12.4 kWh',
    },
    water: {
      unit: 'm3',
      avgDailyUsage: '8.2 m3',
    },
    gas: {
      unit: 'm3',
      avgDailyUsage: '6.8 m3',
    },
    transport: {
      unit: 'trips',
      avgDailyUsage: '3.2 trips',
    },
  } as const

  return (Object.keys(base) as UtilitiesResourceKey[]).reduce<Record<UtilitiesResourceKey, UtilitiesResourceMetrics>>(
    (accumulator, resource) => {
      const relatedEvents = events.filter((item) =>
        normalizeUtilityResource(`${item.title} ${item.eventType} ${item.description}`) === resource,
      )
      const relatedObservations = observations.filter((item) =>
        JSON.stringify(item.payload).toLowerCase().includes(resource === 'transport' ? 'traffic' : resource),
      )
      const relatedAssets = assets.filter((item) =>
        normalizeUtilityResource(`${item.name ?? ''} ${item.type} ${item.description ?? ''}`) === resource,
      )
      const monthly = Array.from({ length: 6 }, (_, index) => {
        const monthDate = new Date()
        monthDate.setMonth(monthDate.getMonth() - (5 - index))
        const month = monthDate.toLocaleString('en-US', { month: 'short' })
        const current = 200 + relatedEvents.length * 30 + relatedObservations.length * 18 + index * 22 + relatedAssets.length * 10
        const previous = Math.max(0, current - (20 + relatedEvents.length * 4))
        const predicted = current + Math.max(5, relatedObservations.length * 3)

        return {
          month,
          current,
          previous,
          predicted,
        }
      })
      const currentValue = monthly.reduce((sum, item) => sum + item.current, 0)
      const previousValue = monthly.reduce((sum, item) => sum + item.previous, 0)

      accumulator[resource] = {
        unit: base[resource].unit,
        currentValue,
        previousValue,
        efficiency: Math.max(55, Math.min(98, 72 + relatedObservations.length * 4 + relatedAssets.length * 3)),
        cost: Math.round(currentValue * (resource === 'electricity' ? 0.08 : resource === 'water' ? 0.05 : resource === 'gas' ? 0.07 : 0.03)),
        monthly,
        peakHours: resource === 'transport' ? '07:00 - 09:00' : '18:00 - 21:00',
        activeConnections: Math.max(1, relatedAssets.length * 24 + relatedObservations.length * 12),
        avgDailyUsage: base[resource].avgDailyUsage,
      }

      return accumulator
    },
    {} as Record<UtilitiesResourceKey, UtilitiesResourceMetrics>,
  )
}

function buildUtilitiesReportTargets(
  assets: AssetItem[],
): UtilitiesReportTarget[] {
  return assets.slice(0, 20).map((asset) => ({
    assetId: asset.id,
    name: asset.name || `${asset.type} asset`,
    resource: normalizeUtilityResource(`${asset.name ?? ''} ${asset.type}`),
    location: asset.locationName ?? asset.address ?? 'Unknown location',
  }))
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
  const shouldLoadDeveloperProfiles = role === 'developer'
  const shouldLoadTotalUsers = role === 'admin'
  const shouldLoadCurrentProfile =
    (role === 'industrialist' || role === 'akimat' || role === 'developer') &&
    Boolean(userId)
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

  const actorProfilesResult =
    shouldLoadAdminProfiles || shouldLoadAkimatProfiles || shouldLoadDeveloperProfiles
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
  const industrialAssetIds = new Set(assets.map((item) => item.id))
  const industrialEvents = role === 'industrialist'
    ? filterIndustrialEvents(events, industrialAssetIds, userId ?? null)
    : []
  const industrialEventIds = new Set(industrialEvents.map((item) => item.id))
  const industrialCases = role === 'industrialist'
    ? filterIndustrialCases(cases, industrialEventIds, userId ?? null)
    : []
  const industrialCaseIds = new Set(industrialCases.map((item) => item.id))
  const industrialObservations = role === 'industrialist'
    ? filterIndustrialObservations(
        observations,
        industrialAssetIds,
        industrialCaseIds,
        userId ?? null,
      )
    : []
  const industrialIncidents = buildIndustrialIncidents(industrialCases, industrialEvents)
  const industrialProduction = buildIndustrialProductionData(assets, industrialEvents)
  const industrialFinances = buildIndustrialFinancesData(
    industrialProduction,
    industrialIncidents,
  )
  const industrialNotifications = buildIndustrialNotifications(
    industrialIncidents,
    industrialCases,
  )
  const industrialEmissions = buildIndustrialEmissionData(
    industrialEvents,
    industrialObservations,
    industrialIncidents,
  )
  const utilityObservations = observations.filter((item) =>
    JSON.stringify(item.payload).toLowerCase().includes('utility') ||
    JSON.stringify(item.payload).toLowerCase().includes('electric') ||
    JSON.stringify(item.payload).toLowerCase().includes('water') ||
    JSON.stringify(item.payload).toLowerCase().includes('gas') ||
    JSON.stringify(item.payload).toLowerCase().includes('traffic'),
  )
  const utilityResources = buildUtilitiesResources(events, utilityObservations, assets)
  const utilityEvents = buildUtilityEvents(events, cases)
  const utilityDistricts = buildUtilitiesDistricts(locations, utilityObservations)
  const utilityReportTargets = buildUtilitiesReportTargets(assets)

  return {
    data: {
      dashboard: {
        events: buildDashboardEvents(events),
        appeals: buildDashboardAppeals(cases, events),
        news: buildDashboardNews(events),
        situations: buildDashboardSituations(events, cases),
        locationOptions: buildDashboardLocationOptions(locations),
        mapMarkers: buildDashboardMapMarkers(
          locations,
          assets,
          events,
          observations,
        ),
      },
      developer: {
        objects: buildConstructionObjects(
          assets,
          events,
          cases,
          profilesMap,
          currentProfileResult.data,
        ),
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
          notifications: industrialNotifications.length,
        },
        notifications: industrialNotifications,
        emissions: industrialEmissions,
        production: industrialProduction,
        finances: industrialFinances,
      },
      utilities: {
        chartTypes: utilitiesChartTypes,
        resources: utilityResources,
        events: utilityEvents,
        districts: utilityDistricts,
        reportTargets: utilityReportTargets,
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
