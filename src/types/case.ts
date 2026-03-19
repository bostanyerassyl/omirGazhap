export type CaseStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected'

export type CasePriority = 'low' | 'medium' | 'high' | 'urgent'

export type CaseVisibility = 'owner' | 'role' | 'public'

export type CaseItem = {
  id: string
  eventId: string | null
  createdBy: string | null
  assignedTo: string | null
  assignedRole: string | null
  status: CaseStatus
  priority: CasePriority
  visibility: CaseVisibility
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}
