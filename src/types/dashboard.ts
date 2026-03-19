import type { Role } from './auth'

export type ConstructionStatus =
  | 'planning'
  | 'in-progress'
  | 'completed'
  | 'delayed'

export type ConstructionObject = {
  id: string
  locationId: string | null
  type: string
  name: string
  address: string
  description: string
  contactPhone: string
  developerName: string
  status: ConstructionStatus
  deadline: string
  progress: number
  coordinates: { lat: number; lng: number }
  reports: Array<{
    id: string
    title: string
    status: string
    date: string
  }>
}

export type DashboardEvent = {
  id: string
  title: string
  date: string
  time: string
  location: string
}

export type DashboardAppeal = {
  id: string
  category: string
  message: string
  date: string
  status: 'pending' | 'in-progress' | 'resolved'
}

export type DashboardNewsItem = {
  id: string
  title: string
  summary: string
  date: string
  category: string
}

export type DashboardSituation = {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  date: string
}

export type DashboardLocationOption = {
  id: string
  name: string
}

export type DashboardMapMarker = {
  id: string
  type: 'building' | 'event' | 'place'
  x: number
  y: number
  label: string
  details?: {
    title?: string
    description?: string
    status?: string
    eventDate?: string
  }
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

export type IndustrialistMetricCard = {
  label: string
  value: string
  change: number
  subtext: string
}

export type IndustrialistMonthlyEmissionPoint = {
  month: string
  co2: number
  nox: number
  so2: number
  particles: number
}

export type IndustrialistBreakdownItem = {
  name: string
  value: number
  color: string
}

export type IndustrialistIncident = {
  id: string
  type: 'leak' | 'excess' | 'violation' | 'accident'
  title: string
  date: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  consequence: string
  solution: string
  status: 'pending' | 'in-progress' | 'resolved'
  reportedToAkimat: boolean
  assetId: string | null
}

export type IndustrialistProductionPoint = {
  month: string
  actual: number
  target: number
  efficiency: number
}

export type IndustrialistProductLine = {
  id: string
  name: string
  units: number
  target: number
  efficiency: number
  status: 'on-track' | 'exceeding' | 'behind'
}

export type IndustrialistWeeklyShiftPoint = {
  day: string
  shift1: number
  shift2: number
  shift3: number
}

export type IndustrialistQuarterlyComparison = {
  quarter: string
  current: number
  previous: number
  growth: number
}

export type IndustrialistTransaction = {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
}

export type IndustrialistNotification = {
  id: string
  title: string
  description: string
  date: string
}

export type IndustrialistEmissionsData = {
  stats: IndustrialistMetricCard[]
  monthly: IndustrialistMonthlyEmissionPoint[]
  breakdown: IndustrialistBreakdownItem[]
  incidents: IndustrialistIncident[]
}

export type IndustrialistProductionData = {
  stats: IndustrialistMetricCard[]
  monthly: IndustrialistProductionPoint[]
  productLines: IndustrialistProductLine[]
  weekly: IndustrialistWeeklyShiftPoint[]
  workforce: {
    totalWorkers: number
    productionLines: number
    activeShifts: number
    capacityUsed: number
  }
}

export type IndustrialistFinancesData = {
  stats: IndustrialistMetricCard[]
  monthly: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
  expenseBreakdown: Array<IndustrialistBreakdownItem & { amount: number }>
  quarterly: IndustrialistQuarterlyComparison[]
  transactions: IndustrialistTransaction[]
  summary: {
    totalRevenue: number
    totalExpenses: number
    totalProfit: number
    taxesPaid: number
  }
}

export type UtilitiesChartType = 'area' | 'bar' | 'line'
export type UtilitiesResourceKey = 'electricity' | 'water' | 'gas' | 'transport'

export type UtilitiesChartTypeOption = {
  id: UtilitiesChartType
  label: string
}

export type UtilitiesChartPoint = {
  month: string
  current: number
  previous: number
  predicted: number
}

export type UtilitiesOperationalEvent = {
  id: string
  title: string
  description: string
  type: 'warning' | 'prediction' | 'opportunity' | 'alert'
  resource: UtilitiesResourceKey
  impact: 'high' | 'medium' | 'low'
  predictedChange: number
  date: string
  location: string
  status: 'pending' | 'in-progress' | 'resolved'
}

export type UtilitiesResourceMetrics = {
  unit: string
  currentValue: number
  previousValue: number
  efficiency: number
  cost: number
  monthly: UtilitiesChartPoint[]
  peakHours: string
  activeConnections: number
  avgDailyUsage: string
}

export type UtilitiesDistrictMetric = {
  id: string
  name: string
  consumption: number
}

export type UtilitiesReportTarget = {
  assetId: string
  name: string
  resource: UtilitiesResourceKey
  location: string
}

export type DashboardData = {
  dashboard: {
    events: DashboardEvent[]
    appeals: DashboardAppeal[]
    news: DashboardNewsItem[]
    situations: DashboardSituation[]
    locationOptions: DashboardLocationOption[]
    mapMarkers: DashboardMapMarker[]
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
    notifications: IndustrialistNotification[]
    emissions: IndustrialistEmissionsData
    production: IndustrialistProductionData
    finances: IndustrialistFinancesData
  }
  utilities: {
    chartTypes: UtilitiesChartTypeOption[]
    resources: Record<UtilitiesResourceKey, UtilitiesResourceMetrics>
    events: UtilitiesOperationalEvent[]
    districts: UtilitiesDistrictMetric[]
    reportTargets: UtilitiesReportTarget[]
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
