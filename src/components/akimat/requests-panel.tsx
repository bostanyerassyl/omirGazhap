import { useState } from "react"
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
  Filter,
  User,
  MapPin,
  X
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/utils/cn"

interface Request {
  id: string
  type: "complaint" | "suggestion" | "letter"
  subject: string
  message: string
  from: string
  address: string
  date: string
  status: "pending" | "in-progress" | "resolved" | "rejected"
  category: string
}

const requests: Request[] = [
  { id: "1", type: "complaint", subject: "Street Light Not Working", message: "The street lights on Satpayev St have been out for 3 days. It's very dark and unsafe at night.", from: "Askar Nurlan", address: "Satpayev St, 56", date: "2024-01-18", status: "in-progress", category: "Infrastructure" },
  { id: "2", type: "suggestion", subject: "New Bike Lane Proposal", message: "I suggest adding a bike lane on Al-Farabi Ave to promote eco-friendly transportation.", from: "Maria Petrova", address: "Al-Farabi Ave, 100", date: "2024-01-17", status: "pending", category: "Transport" },
  { id: "3", type: "letter", subject: "Thank You for Park Renovation", message: "Thank you for the beautiful renovation of the Central Park. My family loves the new playground!", from: "Dinara Suleimen", address: "Dostyk St, 45", date: "2024-01-16", status: "resolved", category: "General" },
  { id: "4", type: "complaint", subject: "Water Pressure Issue", message: "Low water pressure in our building for the past week. Please investigate.", from: "Timur Kazakh", address: "Tole Bi St, 78", date: "2024-01-15", status: "resolved", category: "Utilities" },
  { id: "5", type: "suggestion", subject: "Smart Traffic Lights", message: "Implement AI-powered traffic lights at major intersections to reduce congestion.", from: "Arman Tech", address: "Nazarbayev Ave, 200", date: "2024-01-14", status: "pending", category: "Transport" },
  { id: "6", type: "complaint", subject: "Garbage Collection Delay", message: "Garbage has not been collected in our area for 5 days. Health hazard!", from: "Gulnara Akhmet", address: "Zhandosov St, 34", date: "2024-01-18", status: "pending", category: "Sanitation" },
  { id: "7", type: "letter", subject: "Business Permit Inquiry", message: "Requesting information about obtaining a business permit for a new cafe.", from: "Bakyt Enterprises", address: "Abay St, 120", date: "2024-01-13", status: "in-progress", category: "Business" },
  { id: "8", type: "complaint", subject: "Construction Noise", message: "Construction work starting at 6 AM is disturbing residents. Please enforce noise regulations.", from: "Residents Association", address: "Baitursynov St, 67", date: "2024-01-12", status: "rejected", category: "Construction" },
]

const typeIcons = {
  complaint: AlertCircle,
  suggestion: Lightbulb,
  letter: Mail,
}

const typeColors = {
  complaint: "text-red-400",
  suggestion: "text-green-400",
  letter: "text-blue-400",
}

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/20" },
  "in-progress": { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/20" },
  resolved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
}

export function RequestsPanel() {
  const [search, setSearch] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.subject.toLowerCase().includes(search.toLowerCase()) ||
                          r.from.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    inProgress: requests.filter(r => r.status === "in-progress").length,
    resolved: requests.filter(r => r.status === "resolved").length,
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {stats.pending > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {stats.pending}
            </span>
          )}
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
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcons[selectedRequest.type]
                    return <Icon className={cn("h-5 w-5", typeColors[selectedRequest.type])} />
                  })()}
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {selectedRequest.type}
                  </span>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium flex items-center gap-1",
                  statusConfig[selectedRequest.status].bg,
                  statusConfig[selectedRequest.status].color
                )}>
                  {(() => {
                    const StatusIcon = statusConfig[selectedRequest.status].icon
                    return <StatusIcon className="h-3 w-3" />
                  })()}
                  {selectedRequest.status.replace("-", " ")}
                </div>
              </div>

              <h2 className="text-xl font-semibold">{selectedRequest.subject}</h2>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Category: {selectedRequest.category}</span>
                <span className="text-muted-foreground">{selectedRequest.date}</span>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="font-medium">Update Status</h3>
                <div className="flex gap-2">
                  {(["pending", "in-progress", "resolved", "rejected"] as const).map((status) => (
                    <Button
                      key={status}
                      variant={selectedRequest.status === status ? "default" : "outline"}
                      size="sm"
                      className="text-xs capitalize"
                    >
                      {status.replace("-", " ")}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="font-medium">Send Response</h3>
                <textarea
                  placeholder="Write your response to the citizen..."
                  className="w-full h-24 bg-secondary/50 border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button className="w-full">Send Response</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 h-[calc(100vh-80px)] overflow-y-auto">
            {/* Stats */}
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

            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" onValueChange={setStatusFilter}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in-progress">Active</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Request List */}
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
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn("h-4 w-4", typeColors[request.type])} />
                        <span className="font-medium text-sm truncate max-w-[200px]">
                          {request.subject}
                        </span>
                      </div>
                      <div className={cn(
                        "px-2 py-0.5 rounded text-xs flex items-center gap-1",
                        statusConfig[request.status].bg,
                        statusConfig[request.status].color
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {request.status.replace("-", " ")}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {request.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{request.from}</span>
                      <span>{request.date}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

