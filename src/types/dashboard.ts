import type { Role } from './auth'

export type ConstructionStatus =
  | 'planning'
  | 'in-progress'
  | 'completed'
  | 'delayed'

export type ConstructionObject = {
  id: string
  name: string
  address: string
  status: ConstructionStatus
  deadline: string
  progress: number
  coordinates: { lat: number; lng: number }
}

export type DashboardEvent = {
  id: string
  title: string
  date: string
  time: string
  location: string
}

export type AkimatQuickStat = {
  label: string
  value: string
  icon: 'building' | 'alert' | 'camera' | 'chart'
  color: string
}

export type CitizenRequestType = 'complaint' | 'suggestion' | 'letter'

export type CitizenRequestStatus =
  | 'pending'
  | 'in-progress'
  | 'resolved'
  | 'rejected'

export type CitizenRequest = {
  id: string
  type: CitizenRequestType
  subject: string
  message: string
  from: string
  address: string
  date: string
  status: CitizenRequestStatus
  category: string
}

export type AkimatCameraStatus = 'online' | 'offline' | 'maintenance'

export type AkimatCameraFeed = {
  id: string
  name: string
  location: string
  type: 'road' | 'courtyard' | 'building' | 'street'
  status: AkimatCameraStatus
  thumbnail: 'road' | 'courtyard' | 'building' | 'street'
}

export type AkimatFacility = {
  id: string
  name: string
  developer: string
  developerContact: {
    phone: string
    email: string
  }
  address: string
  type: 'residential' | 'commercial' | 'industrial' | 'public'
  status: 'planning' | 'in-progress' | 'completed' | 'delayed'
  progress: number
  deadline: string
  startDate: string
  details: string
  reports: number
  lastUpdate: string
}

export type AkimatMapMarker = {
  id: string
  type: 'building' | 'problem' | 'construction' | 'utility-issue'
  name: string
  address: string
  lat: number
  lng: number
  status?: string
  details?: string
  reportedBy?: string
  date?: string
}

export type AkimatRequestOverview = {
  complaints: number
  suggestions: number
  letters: number
  total: number
}

export type AkimatSurveillanceSummary = {
  online: number
  offline: number
  maintenance: number
  total: number
}

export type AkimatReportsSummary = {
  developer: number
  utilities: number
  industrialist: number
  total: number
}

export type AkimatProfileSummary = {
  name: string
  email: string
  avatar: string
}

export type AkimatUtilityMetricPoint = {
  period: string
  events: number
  cases: number
  observations: number
}

export type AkimatZoneMetric = {
  zone: string
  facilities: number
  issues: number
  cameras: number
}

export type AkimatIndustrialMetricPoint = {
  period: string
  facilities: number
  issues: number
  observations: number
}

export type AkimatTrafficMetricPoint = {
  period: string
  incidents: number
  observations: number
}

export type AkimatStreetTraffic = {
  name: string
  congestion: number
  avgSpeed: number
  incidents: number
}

export type AkimatStatistics = {
  utilitySummary: {
    events: number
    cases: number
    observations: number
  }
  utilityMonthly: AkimatUtilityMetricPoint[]
  utilityByZone: AkimatZoneMetric[]
  industrialSummary: {
    facilities: number
    issues: number
    observations: number
  }
  industrialMonthly: AkimatIndustrialMetricPoint[]
  trafficSummary: {
    incidents: number
    observations: number
    activeLocations: number
  }
  trafficMonthly: AkimatTrafficMetricPoint[]
  trafficByStreet: AkimatStreetTraffic[]
}

export type AkimatActivity = {
  type: 'request' | 'camera' | 'facility' | 'stats'
  text: string
  time: string
  icon: 'alert' | 'camera' | 'building' | 'chart'
  color: string
}

export type AdminRequestStatus =
  | 'pending'
  | 'in-review'
  | 'approved'
  | 'rejected'

export type FeatureRequest = {
  id: string
  type: 'feature' | 'bug' | 'improvement'
  title: string
  description: string
  submittedBy: string
  role: Role | 'resident'
  email: string
  date: string
  status: AdminRequestStatus
  priority: 'low' | 'medium' | 'high'
}

export type LocationRequest = {
  id: string
  type: 'place' | 'ramp' | 'event' | 'hazard'
  name: string
  address: string
  submittedBy: string
  role: Role | 'resident'
  date: string
  coordinates: { lat: number; lng: number }
  photos: number
  status: AdminRequestStatus
}

export type RoleRequest = {
  id: string
  username: string
  fullName: string
  email: string
  requestedRole: Role | 'resident'
  currentRole: Role | 'resident'
  company: string
  documents: string[]
  date: string
  status: AdminRequestStatus
}

export type IndustrialistCompanyInfo = {
  name: string
  avatar: string
  notifications: number
}

export type UtilitiesChartType = 'area' | 'bar' | 'line'

export type UtilitiesChartTypeOption = {
  id: UtilitiesChartType
  label: string
}

export type DashboardData = {
  dashboard: {
    events: DashboardEvent[]
  }
  developer: {
    objects: ConstructionObject[]
  }
  akimat: {
    quickStats: AkimatQuickStat[]
    recentActivity: AkimatActivity[]
    requestOverview: AkimatRequestOverview
    surveillanceSummary: AkimatSurveillanceSummary
    reportsSummary: AkimatReportsSummary
    citizenRequests: CitizenRequest[]
    cameras: AkimatCameraFeed[]
    facilities: AkimatFacility[]
    mapMarkers: AkimatMapMarker[]
    statistics: AkimatStatistics
    notifications: number
    profile: AkimatProfileSummary
  }
  industrialist: {
    companyInfo: IndustrialistCompanyInfo
  }
  utilities: {
    chartTypes: UtilitiesChartTypeOption[]
  }
  admin: {
    totalUsers: number
    featureRequests: FeatureRequest[]
    locationRequests: LocationRequest[]
    roleRequests: RoleRequest[]
  }
}

export type AdminReviewAction = 'approve' | 'reject'
export type AdminReviewTarget = 'request' | 'location' | 'role'
