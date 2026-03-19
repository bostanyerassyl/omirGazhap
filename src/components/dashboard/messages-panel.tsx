import { useState } from "react"
import {
  MessageSquare,
  Send,
  Calendar,
  Newspaper,
  AlertTriangle,
  ChevronRight,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/utils/cn"
import type {
  DashboardAppeal,
  DashboardEvent,
  DashboardNewsItem,
  DashboardSituation,
} from "@/types/dashboard"

type MessagesPanelProps = {
  appeals: DashboardAppeal[]
  events: DashboardEvent[]
  news: DashboardNewsItem[]
  situations: DashboardSituation[]
  onSubmitAppeal: (payload: {
    category: string
    message: string
  }) => Promise<void>
}

const statusColors = {
  pending: "text-yellow-500",
  "in-progress": "text-blue-500",
  resolved: "text-green-500",
}

const severityColors = {
  low: "border-l-green-500",
  medium: "border-l-yellow-500",
  high: "border-l-red-500",
}

export function MessagesPanel({
  appeals,
  events,
  news,
  situations,
  onSubmitAppeal,
}: MessagesPanelProps) {
  const [newAppeal, setNewAppeal] = useState({ category: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmitAppeal = async () => {
    if (!newAppeal.category || !newAppeal.message) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await onSubmitAppeal(newAppeal)
      setNewAppeal({ category: "", message: "" })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit appeal.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-secondary"
          aria-label="Messages and appeals"
        >
          <MessageSquare className="size-5 text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 size-2 bg-accent rounded-full" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-foreground">City Hub</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Appeals, events, news, and situations
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="appeals" className="mt-6">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="appeals" className="flex-1 text-xs sm:text-sm">Appeals</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 text-xs sm:text-sm">Events</TabsTrigger>
            <TabsTrigger value="news" className="flex-1 text-xs sm:text-sm">News</TabsTrigger>
            <TabsTrigger value="situations" className="flex-1 text-xs sm:text-sm">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="appeals" className="mt-4 space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-foreground">Submit New Appeal</h4>
              <Select
                value={newAppeal.category}
                onValueChange={(value) => setNewAppeal((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="transport">Public Transport</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="safety">Public Safety</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Describe your concern..."
                value={newAppeal.message}
                onChange={(event) =>
                  setNewAppeal((prev) => ({ ...prev, message: event.target.value }))
                }
                className="bg-secondary border-border text-foreground min-h-[80px] resize-none"
              />
              {submitError ? <StatusMessage tone="error">{submitError}</StatusMessage> : null}
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => void handleSubmitAppeal()}
                disabled={!newAppeal.category || !newAppeal.message || submitting}
              >
                <Send className="size-4 mr-2" />
                {submitting ? "Submitting..." : "Submit to Mayor Office"}
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Your Appeals</h4>
              {appeals.length === 0 ? (
                <div className="p-3 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                  No appeals yet.
                </div>
              ) : (
                appeals.map((appeal) => (
                  <div key={appeal.id} className="p-3 bg-secondary/30 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-accent">{appeal.category}</span>
                      <span className={cn("text-xs capitalize", statusColors[appeal.status])}>
                        {appeal.status.replace("-", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{appeal.message}</p>
                    <p className="text-xs text-muted-foreground">{appeal.date}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-3">
            {events.length === 0 ? (
              <div className="p-3 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                No public events available.
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3 text-accent" />
                        <span>{event.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="news" className="mt-4 space-y-3">
            {news.length === 0 ? (
              <div className="p-3 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                No city news available.
              </div>
            ) : (
              news.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Newspaper className="size-3.5 text-accent" />
                        <span className="text-xs text-accent">{item.category}</span>
                      </div>
                      <h4 className="font-medium text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="situations" className="mt-4 space-y-3">
            {situations.length === 0 ? (
              <div className="p-3 bg-secondary/30 rounded-lg text-sm text-muted-foreground">
                No active city alerts.
              </div>
            ) : (
              situations.map((situation) => (
                <div
                  key={situation.id}
                  className={cn(
                    "p-4 bg-secondary/30 rounded-lg border-l-4",
                    severityColors[situation.severity],
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={cn(
                        "size-4 mt-0.5 shrink-0",
                        situation.severity === "high" && "text-red-500",
                        situation.severity === "medium" && "text-yellow-500",
                        situation.severity === "low" && "text-green-500",
                      )}
                    />
                    <div className="space-y-1">
                      <h4 className="font-medium text-foreground">{situation.title}</h4>
                      <p className="text-sm text-muted-foreground">{situation.description}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{situation.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

