"use client"

import { useState } from "react"
import { 
  MessageSquare, 
  Send, 
  Calendar, 
  Newspaper, 
  AlertTriangle,
  ChevronRight,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface Appeal {
  id: string
  category: string
  message: string
  date: string
  status: "pending" | "in-progress" | "resolved"
}

interface Event {
  id: string
  title: string
  date: string
  location: string
  type: "cultural" | "sports" | "community"
}

interface NewsItem {
  id: string
  title: string
  summary: string
  date: string
  category: string
}

interface Situation {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high"
  date: string
}

const mockAppeals: Appeal[] = [
  { id: "1", category: "Infrastructure", message: "Street light not working on Block 7", date: "2026-03-18", status: "in-progress" },
  { id: "2", category: "Public Transport", message: "Bus 42 often late in the morning", date: "2026-03-15", status: "resolved" },
]

const mockEvents: Event[] = [
  { id: "1", title: "Alatau City Festival 2026", date: "March 25, 2026", location: "Central Park", type: "cultural" },
  { id: "2", title: "Smart City Marathon", date: "April 5, 2026", location: "City Center", type: "sports" },
  { id: "3", title: "Community Clean-up Day", date: "March 30, 2026", location: "Various Locations", type: "community" },
]

const mockNews: NewsItem[] = [
  { id: "1", title: "New Metro Line Opening", summary: "The Green Line extension will open next month, connecting downtown to the airport.", date: "March 19, 2026", category: "Transport" },
  { id: "2", title: "Smart Parking System Launch", summary: "AI-powered parking guidance system now active in 15 city blocks.", date: "March 17, 2026", category: "Technology" },
  { id: "3", title: "Water Conservation Program", summary: "New initiative offers smart water meters to residents at subsidized rates.", date: "March 15, 2026", category: "Environment" },
]

const mockSituations: Situation[] = [
  { id: "1", title: "Road Construction", description: "Main Avenue closed between blocks 3-5 until March 25", severity: "medium", date: "March 18, 2026" },
  { id: "2", title: "Scheduled Power Maintenance", description: "Brief outages in District 7 on March 22, 10:00-12:00", severity: "low", date: "March 19, 2026" },
]

const statusColors = {
  "pending": "text-yellow-500",
  "in-progress": "text-blue-500",
  "resolved": "text-green-500",
}

const severityColors = {
  "low": "border-l-green-500",
  "medium": "border-l-yellow-500",
  "high": "border-l-red-500",
}

export function MessagesPanel() {
  const [newAppeal, setNewAppeal] = useState({ category: "", message: "" })

  const handleSubmitAppeal = () => {
    if (newAppeal.category && newAppeal.message) {
      setNewAppeal({ category: "", message: "" })
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
            {/* New appeal form */}
            <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-foreground">Submit New Appeal</h4>
              <Select 
                value={newAppeal.category} 
                onValueChange={(value) => setNewAppeal(prev => ({ ...prev, category: value }))}
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
                onChange={(e) => setNewAppeal(prev => ({ ...prev, message: e.target.value }))}
                className="bg-secondary border-border text-foreground min-h-[80px] resize-none"
              />
              <Button 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleSubmitAppeal}
                disabled={!newAppeal.category || !newAppeal.message}
              >
                <Send className="size-4 mr-2" />
                Submit to Mayor Office
              </Button>
            </div>

            {/* Existing appeals */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Your Appeals</h4>
              {mockAppeals.map((appeal) => (
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
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-3">
            {mockEvents.map((event) => (
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
            ))}
          </TabsContent>

          <TabsContent value="news" className="mt-4 space-y-3">
            {mockNews.map((item) => (
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
            ))}
          </TabsContent>

          <TabsContent value="situations" className="mt-4 space-y-3">
            {mockSituations.map((situation) => (
              <div 
                key={situation.id} 
                className={cn(
                  "p-4 bg-secondary/30 rounded-lg border-l-4",
                  severityColors[situation.severity]
                )}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn(
                    "size-4 mt-0.5 shrink-0",
                    situation.severity === "high" && "text-red-500",
                    situation.severity === "medium" && "text-yellow-500",
                    situation.severity === "low" && "text-green-500"
                  )} />
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
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

