import { Bell, Camera, MessageSquare, TriangleAlert } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { AkimatActivity, AkimatCameraFeed, CitizenRequest } from '@/types/dashboard'

type NotificationsPanelProps = {
  count: number
  requests: CitizenRequest[]
  cameras: AkimatCameraFeed[]
  recentActivity: AkimatActivity[]
}

export function NotificationsPanel({
  count,
  requests,
  cameras,
  recentActivity,
}: NotificationsPanelProps) {
  const pendingRequests = requests.filter((request) => request.status === 'pending')
  const cameraIssues = cameras.filter((camera) => camera.status !== 'online')
  const badgeLabel = count > 99 ? '99+' : `${count}`

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 px-1 text-[10px] text-white flex items-center justify-center">
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            Notifications
          </SheetTitle>
        </SheetHeader>

        <div className="h-[calc(100vh-80px)] overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-secondary/50 p-3 text-center">
              <p className="text-2xl font-semibold">{count}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-3 text-center">
              <p className="text-2xl font-semibold text-amber-400">{pendingRequests.length}</p>
              <p className="text-xs text-muted-foreground">Pending Requests</p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-3 text-center">
              <p className="text-2xl font-semibold text-red-400">{cameraIssues.length}</p>
              <p className="text-xs text-muted-foreground">Camera Issues</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pending Requests</h3>
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending citizen requests.</p>
            ) : (
              pendingRequests.slice(0, 8).map((request) => (
                <div key={request.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-0.5 h-4 w-4 text-amber-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{request.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {request.from} · {request.address}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Camera Alerts</h3>
            {cameraIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">All tracked cameras are online.</p>
            ) : (
              cameraIssues.slice(0, 8).map((camera) => (
                <div key={camera.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-3">
                    <Camera className="mt-0.5 h-4 w-4 text-red-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{camera.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {camera.location} · {camera.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Activity</h3>
            {(recentActivity.length === 0 ? [] : recentActivity.slice(0, 8)).map((activity, index) => (
              <div key={`${activity.text}-${index}`} className="rounded-lg border border-border p-3">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 text-accent" />
                  <div className="min-w-0">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
