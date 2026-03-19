import { useState } from 'react'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
  Search,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utils/cn'
import type { AkimatFacility } from '@/types/dashboard'

const typeColors = {
  residential: 'bg-blue-500',
  commercial: 'bg-emerald-500',
  industrial: 'bg-orange-500',
  public: 'bg-purple-500',
}

const statusConfig = {
  planning: { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Planning' },
  'in-progress': { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'In Progress' },
  completed: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Completed' },
  delayed: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Delayed' },
}

type FacilitiesPanelProps = {
  facilities: AkimatFacility[]
}

export function FacilitiesPanel({ facilities }: FacilitiesPanelProps) {
  const [search, setSearch] = useState('')
  const [selectedFacility, setSelectedFacility] = useState<AkimatFacility | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredFacilities = facilities.filter((facility) => {
    const matchesSearch =
      facility.name.toLowerCase().includes(search.toLowerCase()) ||
      facility.developer.toLowerCase().includes(search.toLowerCase()) ||
      facility.address.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || facility.type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: facilities.length,
    inProgress: facilities.filter((facility) => facility.status === 'in-progress').length,
    delayed: facilities.filter((facility) => facility.status === 'delayed').length,
    completed: facilities.filter((facility) => facility.status === 'completed').length,
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Building2 className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[600px] sm:max-w-full p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            Construction Facilities
          </SheetTitle>
        </SheetHeader>

        {selectedFacility ? (
          <div className="h-[calc(100vh-80px)] overflow-y-auto p-4">
            <button
              onClick={() => setSelectedFacility(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to list
            </button>

            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("w-3 h-3 rounded-full", typeColors[selectedFacility.type])} />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
                    {selectedFacility.type}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium ml-auto",
                    statusConfig[selectedFacility.status].bg,
                    statusConfig[selectedFacility.status].color
                  )}>
                    {statusConfig[selectedFacility.status].label}
                  </span>
                </div>
                <h2 className="text-xl font-semibold">{selectedFacility.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {selectedFacility.address}
                </p>
              </div>

              {/* Progress */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Construction Progress</span>
                  <span className="text-sm font-bold">{selectedFacility.progress}%</span>
                </div>
                <Progress value={selectedFacility.progress} className="h-2" />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Start: {selectedFacility.startDate}</span>
                  <span>Deadline: {selectedFacility.deadline}</span>
                </div>
              </div>

              {/* Developer Info */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-accent" />
                  Developer Information
                </h3>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{selectedFacility.developer}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedFacility.developerContact.phone}`} className="hover:text-accent">
                      {selectedFacility.developerContact.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedFacility.developerContact.email}`} className="hover:text-accent">
                      {selectedFacility.developerContact.email}
                    </a>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                >
                  <a
                    href={`mailto:${selectedFacility.developerContact.email}?subject=${encodeURIComponent(`Akimat inquiry: ${selectedFacility.name}`)}&body=${encodeURIComponent(`Hello,\n\nI am contacting you from the Akimat dashboard regarding ${selectedFacility.name}.\n\n`)}`}
                  >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Developer
                  </a>
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Facility status is derived from project records and is expected to be updated from the developer side.
                </p>
              </div>

              {/* Details */}
              <div>
                <h3 className="font-medium mb-2">Project Details</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedFacility.details}
                </p>
              </div>

              {/* Reports */}
              <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">{selectedFacility.reports} Reports</p>
                    <p className="text-xs text-muted-foreground">Last update: {selectedFacility.lastUpdate}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  Reports are synced from cases and observations.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 h-[calc(100vh-80px)] overflow-y-auto">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Projects</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.delayed}</div>
                <div className="text-xs text-muted-foreground">Delayed</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search facilities or developers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['all', 'residential', 'commercial', 'industrial', 'public'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors capitalize",
                    typeFilter === type
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type === "all" ? "All Types" : type}
                </button>
              ))}
            </div>

            {filteredFacilities.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No facilities found. Add non-camera assets and assign locations to populate this panel.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFacilities.map((facility) => (
                  <button
                    key={facility.id}
                    onClick={() => setSelectedFacility(facility)}
                    className="w-full bg-card hover:bg-secondary/50 border border-border rounded-lg p-4 text-left transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', typeColors[facility.type])} />
                        <span className="font-medium text-sm truncate">{facility.name}</span>
                      </div>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs shrink-0',
                        statusConfig[facility.status].bg,
                        statusConfig[facility.status].color
                      )}>
                        {statusConfig[facility.status].label}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">{facility.developer}</p>

                    <div className="flex items-center gap-2 mb-3">
                      <Progress value={facility.progress} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium">{facility.progress}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground gap-3">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {facility.address}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3" />
                        {facility.deadline}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

