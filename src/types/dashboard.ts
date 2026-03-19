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
  }
  industrialist: {
    companyInfo: IndustrialistCompanyInfo
  }
  utilities: {
    chartTypes: UtilitiesChartTypeOption[]
  }
  admin: {
    featureRequests: FeatureRequest[]
    locationRequests: LocationRequest[]
    roleRequests: RoleRequest[]
  }
}

export type AdminReviewAction = 'approve' | 'reject'
export type AdminReviewTarget = 'request' | 'location' | 'role'
