import { useState } from 'react'
import {
  MessageSquare,
  AlertCircle,
  Lightbulb,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Search,
  User,
  MapPin,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusMessage } from '@/components/ui/status-message'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/utils/cn'
import type { CitizenRequest } from '@/types/dashboard'

const typeIcons = {
  complaint: AlertCircle,
  suggestion: Lightbulb,
  letter: Mail,
}

const typeColors = {
  complaint: 'text-red-400',
  suggestion: 'text-green-400',
  letter: 'text-blue-400',
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  'in-progress': { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  resolved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
} as const

type RequestsPanelProps = {
  requests: CitizenRequest[]
  onUpdateStatus: (
    id: string,
    status: CitizenRequest['status'],
  ) => Promise<{ error: Error | null }>
}

export function RequestsPanel({ requests, onUpdateStatus }: RequestsPanelProps) {
  const [search, setSearch] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<CitizenRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const filteredRequests = requests.filter((request) => {
    const query = search.toLowerCase()
    const matchesSearch =
      request.subject.toLowerCase().includes(query) ||
      request.from.toLowerCase().includes(query) ||
      request.address.toLowerCase().includes(query)
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    inProgress: requests.filter((request) => request.status === 'in-progress').length,
    resolved: requests.filter((request) => request.status === 'resolved').length,
  }

  const handleStatusUpdate = async (status: CitizenRequest['status']) => {
    if (!selectedRequest) {
      return
    }

    setIsUpdatingStatus(true)
    setStatusError(null)

    const result = await onUpdateStatus(selectedRequest.id, status)

    setIsUpdatingStatus(false)

    if (result.error) {
      setStatusError(result.error.message)
      return
    }

    setSelectedRequest((current) =>
      current
        ? {
            ...current,
            status,
          }
        : current,
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {stats.pending > 0 ? (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {stats.pending}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[540px] sm:max-w-full p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            Citizen Requests
          </SheetTitle>
        </SheetHeader>

        {selectedRequest ? (
          <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
            <button
              onClick={() => setSelectedRequest(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to list
            </button>

            <div className="space-y-4">
              {statusError ? (
                <StatusMessage tone="error">{statusError}</StatusMessage>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcons[selectedRequest.type]
                    return <Icon className={cn('h-5 w-5', typeColors[selectedRequest.type])} />
                  })()}
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {selectedRequest.type}
                  </span>
                </div>
                <div
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium flex items-center gap-1',
                    statusConfig[selectedRequest.status].bg,
                    statusConfig[selectedRequest.status].color,
                  )}
                >
                  {(() => {
                    const StatusIcon = statusConfig[selectedRequest.status].icon
                    return <StatusIcon className="h-3 w-3" />
                  })()}
                  {selectedRequest.status.replace('-', ' ')}
                </div>
              </div>

              <h2 className="text-xl font-semibold">{selectedRequest.subject}</h2>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedRequest.from}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedRequest.address}
                </span>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{selectedRequest.message}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedRequest.category}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">{selectedRequest.date}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-medium mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'in-progress', 'resolved', 'rejected'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={selectedRequest.status === status ? 'default' : 'outline'}
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() => void handleStatusUpdate(status)}
                    >
                      {status.replace('-', ' ')}
                    </Button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Status changes are saved to the database and should refresh the dashboard counts.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 h-[calc(100vh-80px)] overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs defaultValue="all" onValueChange={setStatusFilter}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in-progress">Active</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No citizen requests match the current filter.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRequests.map((request) => {
                  const TypeIcon = typeIcons[request.type]
                  const StatusIcon = statusConfig[request.status].icon
                  return (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className="w-full bg-card hover:bg-secondary/50 border border-border rounded-lg p-3 text-left transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <TypeIcon className={cn('h-4 w-4 shrink-0', typeColors[request.type])} />
                          <span className="font-medium text-sm truncate">{request.subject}</span>
                        </div>
                        <div
                          className={cn(
                            'px-2 py-0.5 rounded text-xs flex items-center gap-1 shrink-0',
                            statusConfig[request.status].bg,
                            statusConfig[request.status].color,
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {request.status.replace('-', ' ')}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {request.message}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{request.from}</span>
                        <span className="shrink-0">{request.date}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

