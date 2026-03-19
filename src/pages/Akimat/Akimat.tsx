import {
  User,
  LogOut,
  Settings,
  Building2,
  AlertTriangle,
  Camera,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusMessage } from '@/components/ui/status-message'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AkimatMap } from '@/components/akimat/akimat-map'
import { RequestsPanel } from '@/components/akimat/requests-panel'
import { CamerasPanel } from '@/components/akimat/cameras-panel'
import { FacilitiesPanel } from '@/components/akimat/facilities-panel'
import { StatisticsPanel } from '@/components/akimat/statistics-panel'
import { NotificationsPanel } from '@/components/akimat/notifications-panel'
import { AkimatProfileSheet } from '@/components/akimat/akimat-profile-sheet'
import { useAuth } from '@/features/auth/model/AuthProvider'
import { useDashboardData } from '@/features/dashboard/model/useDashboardData'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export default function AkimatDashboard() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { logout } = useAuth()
  const { data, error, reloadData, updateAkimatRequestStatus } = useDashboardData("akimat")
  const notifications = data?.notifications ?? 0
  const profile = data?.profile
  const requestOverview = data?.requestOverview
  const surveillanceSummary = data?.surveillanceSummary
  const reportsSummary = data?.reportsSummary

  const iconMap = {
    building: Building2,
    alert: AlertTriangle,
    camera: Camera,
    chart: BarChart3,
  } as const

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
        {/* Left side - Profile */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-accent">
                  <AvatarImage src={profile?.avatar} alt={profile?.name || 'Akimat Admin'} />
                  <AvatarFallback className="bg-accent text-accent-foreground font-medium">
                    {(profile?.name || 'Akimat Administrator')
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.name || 'Akimat Administrator'}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.email || 'admin@alatau.gov.kz'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  setIsProfileOpen(true)
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  setIsSettingsOpen(true)
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400" onClick={() => void logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logo */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-accent flex items-center justify-center">
              <span className="text-xs font-bold text-accent-foreground">A</span>
            </div>
            <div>
              <span className="font-semibold text-sm">Alatau</span>
              <span className="text-xs text-muted-foreground ml-1">Akimat</span>
            </div>
          </div>
        </div>

        {/* Center - Title */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center hidden md:block">
          <h1 className="text-sm font-semibold">City Administration Dashboard</h1>
          <p className="text-xs text-muted-foreground">Smart City Control Center</p>
        </div>

        {/* Right side - Action Buttons */}
        <div className="flex items-center gap-2">
          <NotificationsPanel
            count={notifications}
            requests={data?.citizenRequests ?? []}
            cameras={data?.cameras ?? []}
            recentActivity={data?.recentActivity ?? []}
          />

          {/* Main Action Buttons */}
          <RequestsPanel
            requests={data?.citizenRequests ?? []}
            onUpdateStatus={async (id, status) => updateAkimatRequestStatus(id, status)}
          />
          <CamerasPanel cameras={data?.cameras ?? []} />
          <FacilitiesPanel facilities={data?.facilities ?? []} />
          <StatisticsPanel statistics={data?.statistics} />
        </div>
      </header>

      {/* Main Content - Dashboard Grid */}
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(data?.quickStats ?? []).map((stat) => {
            const Icon = iconMap[stat.icon]
            return (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Grid - Map and Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - Smaller */}
          <Card className="lg:col-span-2 bg-card border-border overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>City Overview Map</span>
                <div className="flex items-center gap-2 text-xs font-normal">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Buildings
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Problems
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Construction
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[430px]">
              <AkimatMap />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[350px] overflow-y-auto">
              {(data?.recentActivity ?? []).map((activity, i) => {
                const Icon = iconMap[activity.icon]
                return (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className={`p-1.5 rounded bg-secondary ${activity.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Requests Summary */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Requests Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Complaints</span>
                  <span className="text-sm font-medium text-red-400">{requestOverview?.complaints ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Suggestions</span>
                  <span className="text-sm font-medium text-blue-400">{requestOverview?.suggestions ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Letters</span>
                  <span className="text-sm font-medium text-green-400">{requestOverview?.letters ?? 0}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full mt-3 overflow-hidden flex">
                  <div
                    className="bg-red-400 h-full"
                    style={{ width: `${requestOverview?.total ? (requestOverview.complaints / requestOverview.total) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-blue-400 h-full"
                    style={{ width: `${requestOverview?.total ? (requestOverview.suggestions / requestOverview.total) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-green-400 h-full"
                    style={{ width: `${requestOverview?.total ? (requestOverview.letters / requestOverview.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cameras Summary */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Surveillance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Online</span>
                  <span className="text-sm font-medium text-green-400">{surveillanceSummary?.online ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Offline</span>
                  <span className="text-sm font-medium text-red-400">{surveillanceSummary?.offline ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Maintenance</span>
                  <span className="text-sm font-medium text-amber-400">{surveillanceSummary?.maintenance ?? 0}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full mt-3 overflow-hidden flex">
                  <div
                    className="bg-green-400 h-full"
                    style={{ width: `${surveillanceSummary?.total ? (surveillanceSummary.online / surveillanceSummary.total) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-red-400 h-full"
                    style={{ width: `${surveillanceSummary?.total ? (surveillanceSummary.offline / surveillanceSummary.total) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${surveillanceSummary?.total ? (surveillanceSummary.maintenance / surveillanceSummary.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Received */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reports Received Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">From Developers</span>
                  <span className="text-sm font-medium text-accent">{reportsSummary?.developer ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">From Utilities</span>
                  <span className="text-sm font-medium text-blue-400">{reportsSummary?.utilities ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">From Industrialists</span>
                  <span className="text-sm font-medium text-amber-400">{reportsSummary?.industrialist ?? 0}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full mt-3 overflow-hidden flex">
                  <div
                    className="bg-accent h-full"
                    style={{ width: `${reportsSummary?.total ? (reportsSummary.developer / reportsSummary.total) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-blue-400 h-full"
                    style={{ width: `${reportsSummary?.total ? (reportsSummary.utilities / reportsSummary.total) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${reportsSummary?.total ? (reportsSummary.industrialist / reportsSummary.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AkimatProfileSheet open={isProfileOpen} onOpenChange={setIsProfileOpen} />

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader className="text-left">
            <SheetTitle>Akimat Settings</SheetTitle>
            <SheetDescription>
              Settings are intentionally left empty for now. Theme switching can be added later.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  )
}
