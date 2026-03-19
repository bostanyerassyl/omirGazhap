import { useState } from "react"
import { 
  User,
  LogOut,
  Settings,
  Shield,
  MessageSquare,
  MapPin,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Eye,
  Lightbulb,
  Bug,
  Sparkles,
  Building2,
  Zap,
  Factory,
  Users
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/utils/cn"

// Mock data for feature requests
const featureRequests = [
  {
    id: "1",
    type: "feature",
    title: "Add dark mode toggle in settings",
    description: "It would be great to have a manual toggle for dark/light mode in the user settings instead of only system preference.",
    submittedBy: "Amir Nurgaliyev",
    role: "resident",
    email: "amir@mail.kz",
    date: "2024-01-15",
    status: "pending",
    priority: "medium"
  },
  {
    id: "2",
    type: "bug",
    title: "Map markers not loading on mobile",
    description: "When using the app on iPhone Safari, sometimes the map markers don't appear until you zoom in and out.",
    submittedBy: "KazBuild LLC",
    role: "developer",
    email: "support@kazbuild.kz",
    date: "2024-01-14",
    status: "in-review",
    priority: "high"
  },
  {
    id: "3",
    type: "improvement",
    title: "Better statistics export options",
    description: "Please add PDF and Excel export for the statistics dashboard. Currently only JSON is supported.",
    submittedBy: "Alatau Energy",
    role: "public-utilities",
    email: "admin@alatau-energy.kz",
    date: "2024-01-13",
    status: "approved",
    priority: "low"
  },
  {
    id: "4",
    type: "feature",
    title: "Real-time notifications for emissions alerts",
    description: "We need push notifications when our emissions approach the threshold limits so we can take action proactively.",
    submittedBy: "Steel Works Alatau",
    role: "industrialist",
    email: "env@steelworks.kz",
    date: "2024-01-12",
    status: "pending",
    priority: "high"
  },
  {
    id: "5",
    type: "improvement",
    title: "Integrate with national ID system",
    description: "Allow users to verify their identity using the national eGov ID system for faster registration.",
    submittedBy: "Akimat Department",
    role: "akimat",
    email: "it@akimat.gov.kz",
    date: "2024-01-11",
    status: "pending",
    priority: "medium"
  }
]

// Mock data for location confirmations
const locationRequests = [
  {
    id: "1",
    type: "place",
    name: "New Coffee Shop - Baristar",
    address: "Abay Avenue 45, Central District",
    submittedBy: "Daulet Kasymov",
    role: "resident",
    date: "2024-01-15",
    coordinates: { lat: 43.238, lng: 76.945 },
    photos: 3,
    status: "pending"
  },
  {
    id: "2",
    type: "ramp",
    name: "Wheelchair Ramp at Mall Entrance",
    address: "Dostyk Plaza, Main Entrance",
    submittedBy: "Accessibility Initiative",
    role: "resident",
    date: "2024-01-14",
    coordinates: { lat: 43.241, lng: 76.951 },
    photos: 2,
    status: "pending"
  },
  {
    id: "3",
    type: "event",
    name: "Weekly Farmers Market",
    address: "Green Park, Northern District",
    submittedBy: "Local Farmers Association",
    role: "resident",
    date: "2024-01-13",
    coordinates: { lat: 43.235, lng: 76.938 },
    photos: 5,
    status: "approved"
  },
  {
    id: "4",
    type: "hazard",
    name: "Road Pothole - Dangerous",
    address: "Satpayev Street 78",
    submittedBy: "Anonymous User",
    role: "resident",
    date: "2024-01-12",
    coordinates: { lat: 43.229, lng: 76.942 },
    photos: 1,
    status: "pending"
  }
]

// Mock data for role confirmations
const roleRequests = [
  {
    id: "1",
    username: "kazbuild_admin",
    fullName: "Nurlan Seitov",
    email: "nurlan@kazbuild.kz",
    requestedRole: "developer",
    currentRole: "resident",
    company: "KazBuild Construction LLC",
    documents: ["Business License", "Construction Permit"],
    date: "2024-01-15",
    status: "pending"
  },
  {
    id: "2",
    username: "alatau_power",
    fullName: "Saule Nurbekova",
    email: "saule@alatau-power.kz",
    requestedRole: "public-utilities",
    currentRole: "resident",
    company: "Alatau Power Grid",
    documents: ["Company Certificate", "Authorization Letter"],
    date: "2024-01-14",
    status: "pending"
  },
  {
    id: "3",
    username: "metalworks_env",
    fullName: "Bekzat Omarov",
    email: "bekzat@metalworks.kz",
    requestedRole: "industrialist",
    currentRole: "resident",
    company: "Alatau Metalworks JSC",
    documents: ["Industrial License", "Environmental Permit"],
    date: "2024-01-13",
    status: "in-review"
  },
  {
    id: "4",
    username: "city_planning",
    fullName: "Aliya Kenzhebekova",
    email: "aliya@akimat.gov.kz",
    requestedRole: "akimat",
    currentRole: "resident",
    company: "Alatau City Planning Department",
    documents: ["Government ID", "Department Authorization"],
    date: "2024-01-12",
    status: "pending"
  }
]

const typeIcons: Record<string, typeof Lightbulb> = {
  feature: Sparkles,
  bug: Bug,
  improvement: Lightbulb,
  place: MapPin,
  ramp: Users,
  event: Zap,
  hazard: XCircle
}

const roleIcons: Record<string, typeof User> = {
  resident: User,
  developer: Building2,
  akimat: Shield,
  industrialist: Factory,
  "public-utilities": Zap
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("requests")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<typeof featureRequests[0] | typeof locationRequests[0] | typeof roleRequests[0] | null>(null)
  const [dialogType, setDialogType] = useState<"request" | "location" | "role" | null>(null)
  const [adminNote, setAdminNote] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "in-review": return "bg-amber-500/20 text-amber-400 border-amber-500/30"
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400"
      case "medium": return "bg-amber-500/20 text-amber-400"
      default: return "bg-green-500/20 text-green-400"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "developer": return "text-accent"
      case "akimat": return "text-amber-400"
      case "industrialist": return "text-orange-400"
      case "public-utilities": return "text-blue-400"
      default: return "text-muted-foreground"
    }
  }

  const stats = {
    pendingRequests: featureRequests.filter(r => r.status === "pending").length,
    pendingLocations: locationRequests.filter(r => r.status === "pending").length,
    pendingRoles: roleRequests.filter(r => r.status === "pending").length,
    totalUsers: 15234
  }

  const openDialog = (item: typeof featureRequests[0] | typeof locationRequests[0] | typeof roleRequests[0], type: "request" | "location" | "role") => {
    setSelectedItem(item)
    setDialogType(type)
    setAdminNote("")
  }

  const handleAction = (action: "approve" | "reject") => {
    // In a real app, this would update the database
    console.log(`${action} item:`, selectedItem, "Note:", adminNote)
    setSelectedItem(null)
    setDialogType(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
        {/* Left side - Profile */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-red-500">
                  <AvatarImage src="" alt="Admin" />
                  <AvatarFallback className="bg-red-500 text-white font-medium">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">System Administrator</p>
                  <p className="text-xs text-muted-foreground">admin@alatau.system</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>System Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-red-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-sm">Alatau</span>
              <span className="text-xs text-red-400 ml-1">Admin</span>
            </div>
          </div>
        </div>

        {/* Center - Title */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center hidden md:block">
          <h1 className="text-sm font-semibold">System Administration</h1>
          <p className="text-xs text-muted-foreground">Database Access Only</p>
        </div>

        {/* Right side - Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="hidden sm:flex items-center gap-4">
            <span className="text-muted-foreground">Total Users: <span className="text-foreground font-medium">{stats.totalUsers.toLocaleString()}</span></span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending Feature Requests</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingLocations}</p>
                <p className="text-xs text-muted-foreground">Locations to Confirm</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRoles}</p>
                <p className="text-xs text-muted-foreground">Role Verifications</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="requests" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Feature Requests</span>
                <span className="sm:hidden">Requests</span>
                <Badge variant="secondary" className="ml-1 text-xs">{featureRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Location Confirmations</span>
                <span className="sm:hidden">Locations</span>
                <Badge variant="secondary" className="ml-1 text-xs">{locationRequests.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Role Verifications</span>
                <span className="sm:hidden">Roles</span>
                <Badge variant="secondary" className="ml-1 text-xs">{roleRequests.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Search and Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[200px] bg-card"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-card">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">{statusFilter === "all" ? "All Status" : statusFilter}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("in-review")}>In Review</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("approved")}>Approved</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>Rejected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Feature Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {featureRequests
              .filter(r => statusFilter === "all" || r.status === statusFilter)
              .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((request) => {
                const TypeIcon = typeIcons[request.type] || Lightbulb
                const RoleIcon = roleIcons[request.role] || User
                return (
                  <Card key={request.id} className="bg-card border-border hover:border-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          request.type === "bug" ? "bg-red-500/20 text-red-400" :
                          request.type === "feature" ? "bg-accent/20 text-accent" :
                          "bg-amber-500/20 text-amber-400"
                        )}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-foreground">{request.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{request.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(request.priority)}>
                                {request.priority}
                              </Badge>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <RoleIcon className={cn("h-3 w-3", getRoleColor(request.role))} />
                                {request.submittedBy}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {request.date}
                              </span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => openDialog(request, "request")}
                            >
                              <Eye className="h-3 w-3" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </TabsContent>

          {/* Location Confirmations Tab */}
          <TabsContent value="locations" className="space-y-4">
            {locationRequests
              .filter(r => statusFilter === "all" || r.status === statusFilter)
              .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.address.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((location) => {
                const TypeIcon = typeIcons[location.type] || MapPin
                return (
                  <Card key={location.id} className="bg-card border-border hover:border-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          location.type === "hazard" ? "bg-red-500/20 text-red-400" :
                          location.type === "ramp" ? "bg-green-500/20 text-green-400" :
                          location.type === "event" ? "bg-amber-500/20 text-amber-400" :
                          "bg-blue-500/20 text-blue-400"
                        )}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-foreground">{location.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{location.address}</p>
                            </div>
                            <Badge className={getStatusColor(location.status)}>
                              {location.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {location.submittedBy}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {location.date}
                              </span>
                              <span className="flex items-center gap-1">
                                {location.photos} photo(s)
                              </span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => openDialog(location, "location")}
                            >
                              <Eye className="h-3 w-3" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </TabsContent>

          {/* Role Verifications Tab */}
          <TabsContent value="roles" className="space-y-4">
            {roleRequests
              .filter(r => statusFilter === "all" || r.status === statusFilter)
              .filter(r => r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || r.company.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((role) => {
                const RoleIcon = roleIcons[role.requestedRole] || User
                return (
                  <Card key={role.id} className="bg-card border-border hover:border-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarFallback className="bg-secondary text-foreground">
                            {role.fullName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-foreground">{role.fullName}</h3>
                              <p className="text-sm text-muted-foreground">@{role.username} • {role.email}</p>
                              <p className="text-sm text-muted-foreground mt-1">{role.company}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={getStatusColor(role.status)}>
                                {role.status}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-muted-foreground">Requesting:</span>
                                <RoleIcon className={cn("h-3 w-3", getRoleColor(role.requestedRole))} />
                                <span className={getRoleColor(role.requestedRole)}>{role.requestedRole}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {role.date}
                              </span>
                              <span className="flex items-center gap-1">
                                {role.documents.length} document(s) attached
                              </span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => openDialog(role, "role")}
                            >
                              <Eye className="h-3 w-3" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </TabsContent>
        </Tabs>
      </main>

      {/* Review Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); setDialogType(null); }}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Review {dialogType === "request" ? "Feature Request" : dialogType === "location" ? "Location" : "Role Verification"}</DialogTitle>
            <DialogDescription>
              Review the details and approve or reject this submission.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              {/* Details based on type */}
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                {"title" in selectedItem && (
                  <>
                    <h4 className="font-medium">{selectedItem.title}</h4>
                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                  </>
                )}
                {"name" in selectedItem && !("fullName" in selectedItem) && (
                  <>
                    <h4 className="font-medium">{selectedItem.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedItem.address}</p>
                  </>
                )}
                {"fullName" in selectedItem && (
                  <>
                    <h4 className="font-medium">{selectedItem.fullName}</h4>
                    <p className="text-sm text-muted-foreground">{selectedItem.company}</p>
                    <p className="text-sm">Requesting: <span className="font-medium">{selectedItem.requestedRole}</span></p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedItem.documents.map(doc => (
                        <Badge key={doc} variant="secondary">{doc}</Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Admin Note */}
              <div>
                <label className="text-sm font-medium mb-2 block">Admin Note (optional)</label>
                <Textarea
                  placeholder="Add a note for the user..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => handleAction("reject")}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button
              className="gap-2 bg-green-500 text-white hover:bg-green-600"
              onClick={() => handleAction("approve")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



