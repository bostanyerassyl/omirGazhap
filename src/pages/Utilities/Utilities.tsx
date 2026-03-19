import { useMemo, useState } from "react"
import {
  User,
  LogOut,
  Settings,
  BarChart3,
  LineChart,
  AreaChartIcon,
  Download,
  RefreshCw,
  Send,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusMessage } from "@/components/ui/status-message"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UtilitiesNav } from "@/components/utilities/utilities-nav"
import { UtilitiesProfileSheet } from "@/components/utilities/utilities-profile-sheet"
import { ResourceChartLive } from "@/components/utilities/resource-chart-live"
import { ScopeSelectorLive } from "@/components/utilities/scope-selector-live"
import { StatsCardsLive } from "@/components/utilities/stats-cards-live"
import { OperationalEventsPanel } from "@/components/utilities/operational-events-panel"
import { UtilitiesMapLive } from "@/components/utilities/utilities-map-live"
import { useAuth } from "@/features/auth/model/AuthProvider"
import { useDashboardData } from "@/features/dashboard/model/useDashboardData"
import type { UtilitiesResourceKey, UtilitiesResourceMetrics } from "@/types/dashboard"
import { cn } from "@/utils/cn"
import { useNavigate } from "react-router-dom"

const emptyMetrics: UtilitiesResourceMetrics = {
  unit: "",
  currentValue: 0,
  previousValue: 0,
  efficiency: 0,
  cost: 0,
  monthly: [],
  peakHours: "No data",
  activeConnections: 0,
  avgDailyUsage: "0",
}

export default function UtilitiesPage() {
  const [activeTab, setActiveTab] = useState<UtilitiesResourceKey | "events">("electricity")
  const [scope, setScope] = useState("city")
  const [district, setDistrict] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { logout, profile } = useAuth()
  const { data, error, reloadData, reportUtilitiesIssue } = useDashboardData("utilities")
  const navigate = useNavigate()

  const chartIcons = {
    area: AreaChartIcon,
    bar: BarChart3,
    line: LineChart,
  } as const

  const districtOptions = data?.districts ?? []
  const selectedDistrict = districtOptions.find((item) => item.id === district) ?? null
  const resourceKey = activeTab === "events" ? "electricity" : activeTab
  const activeMetrics = data?.resources[resourceKey] ?? emptyMetrics
  const filteredTargets = useMemo(() => {
    const targets = data?.reportTargets ?? []
    const sameResource = targets.filter((item) => item.resource === resourceKey)
    return sameResource.length > 0 ? sameResource : targets
  }, [data?.reportTargets, resourceKey])

  const [reportForm, setReportForm] = useState({
    assetId: "",
    resource: "electricity" as UtilitiesResourceKey,
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  const handleScopeChange = (newScope: string, newDistrict: string | null) => {
    setScope(newScope)
    setDistrict(newDistrict)
  }

  const handleDistrictSelect = (districtId: string) => {
    setScope("district")
    setDistrict(districtId)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await reloadData()
    setIsRefreshing(false)
  }

  const handleSendReport = async () => {
    if (!reportForm.assetId || !reportForm.title || !reportForm.description) {
      setReportError("Choose a target, title, and report description.")
      return
    }

    setReportError(null)
    const result = await reportUtilitiesIssue({
      assetId: reportForm.assetId,
      resource: reportForm.resource,
      title: reportForm.title,
      description: reportForm.description,
      priority: reportForm.priority,
    })

    if (result.error) {
      setReportError(result.error.message)
      return
    }

    setReportSent(true)
    setReportDialogOpen(false)
    setReportForm((current) => ({
      ...current,
      title: "",
      description: "",
      priority: "medium",
    }))
    window.setTimeout(() => setReportSent(false), 2500)
  }

  const handleExport = () => {
    const rows =
      activeTab === "events"
        ? [
            ["title", "resource", "impact", "status", "location", "date"],
            ...(data?.events ?? []).map((item) => [
              item.title,
              item.resource,
              item.impact,
              item.status,
              item.location,
              item.date,
            ]),
          ]
        : [
            ["month", "current", "previous", "predicted", "unit"],
            ...activeMetrics.monthly.map((item) => [
              item.month,
              `${item.current}`,
              `${item.previous}`,
              `${item.predicted}`,
              activeMetrics.unit,
            ]),
          ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `utilities-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  const profileName = profile?.fullName || "Public Utilities"
  const profileEmail = profile?.email || "admin@utilities.alatau.kz"
  const profileAvatar = profile?.avatarUrl || ""
  const profileInitials =
    profileName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "PU"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-accent">
                    <AvatarImage src={profileAvatar} alt={profileName} />
                    <AvatarFallback className="bg-secondary text-foreground">{profileInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 border-border bg-card">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{profileName}</p>
                  <p className="text-xs text-muted-foreground">{profileEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsProfileOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-400" onClick={() => void handleLogout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">Alatau Utilities</h1>
              <p className="text-xs text-muted-foreground">Resource Management Dashboard</p>
            </div>
          </div>

          <UtilitiesNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as UtilitiesResourceKey | "events")} />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="bg-card" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button variant="outline" className="hidden gap-2 bg-card sm:flex" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Dialog
              open={reportDialogOpen}
              onOpenChange={(open) => {
                setReportDialogOpen(open)
                if (open) {
                  setReportForm((current) => ({
                    ...current,
                    assetId: current.assetId || filteredTargets[0]?.assetId || "",
                    resource: resourceKey,
                  }))
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" disabled={reportSent}>
                  {reportSent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Sent!</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Report to Akimat</span>
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card">
                <DialogHeader>
                  <DialogTitle>Utility Report for Akimat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="rounded-lg bg-secondary p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="h-4 w-4 text-accent" />
                      Submit a utility incident or operational report
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Choose the target asset and describe what needs municipal review.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Resource</Label>
                    <Select
                      value={reportForm.resource}
                      onValueChange={(value) =>
                        setReportForm((current) => ({
                          ...current,
                          resource: value as UtilitiesResourceKey,
                          assetId: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electricity">Electricity</SelectItem>
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="gas">Gas</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <Select value={reportForm.assetId} onValueChange={(value) => setReportForm((current) => ({ ...current, assetId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select utility asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {(data?.reportTargets ?? [])
                          .filter((item) => item.resource === reportForm.resource)
                          .map((target) => (
                            <SelectItem key={target.assetId} value={target.assetId}>
                              {target.name} · {target.location}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={reportForm.title}
                      onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Example: Water pressure instability"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={reportForm.priority}
                      onValueChange={(value) =>
                        setReportForm((current) => ({
                          ...current,
                          priority: value as "low" | "medium" | "high",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={reportForm.description}
                      onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Describe the issue, impact, and required response."
                    />
                  </div>
                  {reportError ? <StatusMessage tone="error">{reportError}</StatusMessage> : null}
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => void handleSendReport()}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Report
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-6">
        {error ? (
          <StatusMessage tone="error" className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void reloadData()}>
              Retry
            </Button>
          </StatusMessage>
        ) : null}

        {activeTab === "events" ? (
          <OperationalEventsPanel events={data?.events ?? []} />
        ) : (
          <>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <ScopeSelectorLive scope={scope} district={district} districts={districtOptions} onScopeChange={handleScopeChange} />

              <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1">
                {(data?.chartTypes ?? []).map((type) => {
                  const Icon = chartIcons[type.id]
                  return (
                    <Button
                      key={type.id}
                      variant="ghost"
                      size="sm"
                      className={cn("gap-2", chartType === type.id && "bg-card shadow-sm")}
                      onClick={() => setChartType(type.id)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{type.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <StatsCardsLive resource={activeTab} scope={scope} metrics={activeMetrics} district={selectedDistrict} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="border-border bg-card lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>Monthly Consumption</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {scope === "city" ? "City-wide" : selectedDistrict?.name ?? "District scope"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResourceChartLive resource={activeTab} scope={scope} chartType={chartType} metrics={activeMetrics} district={selectedDistrict} />
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">District Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <UtilitiesMapLive onDistrictSelect={handleDistrictSelect} selectedDistrict={district} resource={activeTab} districts={districtOptions} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Peak Hours</h3>
                  <p className="text-2xl font-bold text-foreground">{activeMetrics.peakHours}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Highest consumption period</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Active Connections</h3>
                  <p className="text-2xl font-bold text-foreground">{activeMetrics.activeConnections.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Registered meters</p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Avg. Daily Usage</h3>
                  <p className="text-2xl font-bold text-foreground">{activeMetrics.avgDailyUsage}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Per household</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      <UtilitiesProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  )
}
