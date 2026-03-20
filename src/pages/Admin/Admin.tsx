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
import { StatusMessage } from "@/components/ui/status-message"
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
import { useAuth } from "@/features/auth/model/AuthProvider"
import { adminReviewSchema } from "@/features/admin/model/admin.schema"
import { useDashboardData } from "@/features/dashboard/model/useDashboardData"
import { cn } from "@/utils/cn"
import { AdminProfileSheet } from "@/components/admin/admin-profile-sheet"
import type {
  AdminReviewTarget,
  FeatureRequest,
  LocationRequest,
  RoleRequest,
} from "@/types/dashboard"

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
  utilities: Zap,
  akimat: Shield,
  industrialist: Factory,
}

const roleLabels: Record<string, string> = {
  resident: "Resident",
  developer: "Developer",
  utilities: "ЖКХ",
  akimat: "Akimat",
  industrialist: "Industrialist",
}

export default function AdminDashboard() {
  const { logout, profile } = useAuth()
  const { data, error, reloadData, reviewAdminItem } = useDashboardData("admin")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("requests")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<FeatureRequest | LocationRequest | RoleRequest | null>(null)
  const [dialogType, setDialogType] = useState<AdminReviewTarget | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [adminNoteError, setAdminNoteError] = useState<string | null>(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const featureRequests = data?.featureRequests ?? []
  const locationRequests = data?.locationRequests ?? []
  const roleRequests = data?.roleRequests ?? []
  const profileName = profile?.fullName || "System Administrator"
  const profileEmail = profile?.email || "admin@alatau.system"
  const profileAvatar = profile?.avatarUrl || ""
  const profileInitials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AD"

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
      case "utilities": return "text-blue-400"
      case "akimat": return "text-amber-400"
      case "industrialist": return "text-orange-400"
      default: return "text-muted-foreground"
    }
  }

  const stats = {
    pendingRequests: featureRequests.filter(r => r.status === "pending").length,
    pendingLocations: locationRequests.filter(r => r.status === "pending").length,
    pendingRoles: roleRequests.filter(r => r.status === "pending").length,
    totalUsers: data?.totalUsers ?? 0,
  }

  const openDialog = (item: FeatureRequest | LocationRequest | RoleRequest, type: AdminReviewTarget) => {
    setSelectedItem(item)
    setDialogType(type)
    setAdminNote("")
    setAdminNoteError(null)
  }

  const handleAction = async (action: "approve" | "reject") => {
    const validationResult = adminReviewSchema.safeParse({
      note: adminNote || undefined,
    })

    if (!validationResult.success) {
      setAdminNoteError(validationResult.error.flatten().fieldErrors.note?.[0] ?? null)
      return
    }

    if (!selectedItem || !dialogType) {
      return
    }

    setIsSubmittingReview(true)
    const reviewResult = await reviewAdminItem(
      dialogType,
      selectedItem.id,
      action,
      adminNote || undefined,
    )
    setIsSubmittingReview(false)

    if (reviewResult.error) {
      setAdminNoteError(reviewResult.error.message)
      return
    }

    setSelectedItem(null)
    setDialogType(null)
    setAdminNote("")
    setAdminNoteError(null)
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
                  <AvatarImage src={profileAvatar} alt={profileName} />
                  <AvatarFallback className="bg-red-500 text-white font-medium">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profileName}</p>
                  <p className="text-xs text-muted-foreground">{profileEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setIsProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>System Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400" onClick={() => void logout()}>
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
        {error ? (
          <div className="mb-6">
            <StatusMessage tone="error" className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void reloadData()}>
                Retry
              </Button>
            </StatusMessage>
          </div>
        ) : null}
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
                                <span className={getRoleColor(role.requestedRole)}>
                                  {roleLabels[role.requestedRole] ?? role.requestedRole}
                                </span>
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

      <AdminProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />

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
                    <p className="text-sm">Requesting: <span className="font-medium">{roleLabels[selectedItem.requestedRole] ?? selectedItem.requestedRole}</span></p>
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
                  onChange={(e) => {
                    setAdminNote(e.target.value)
                    setAdminNoteError(null)
                  }}
                  className="bg-secondary/50"
                />
                {adminNoteError ? (
                  <p className="mt-2 text-sm text-red-300">{adminNoteError}</p>
                ) : null}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => void handleAction("reject")}
              disabled={isSubmittingReview}
            >
              <XCircle className="h-4 w-4" />
              {isSubmittingReview ? "Saving..." : "Reject"}
            </Button>
            <Button
              className="gap-2 bg-green-500 text-white hover:bg-green-600"
              onClick={() => void handleAction("approve")}
              disabled={isSubmittingReview}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmittingReview ? "Saving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
