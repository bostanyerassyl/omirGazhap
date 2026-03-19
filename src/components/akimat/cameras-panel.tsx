import { useState } from 'react'
import {
  Camera,
  Video,
  MapPin,
  Maximize2,
  Grid3X3,
  List,
  Search,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { AkimatCameraFeed } from '@/types/dashboard'

const typeFilters = [
  { value: 'all', label: 'All Cameras' },
  { value: 'road', label: 'Roads' },
  { value: 'street', label: 'Streets' },
  { value: 'courtyard', label: 'Courtyards' },
  { value: 'building', label: 'Buildings' },
]

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  maintenance: 'bg-amber-500',
}

function CameraPreview({
  camera,
  onClick,
}: {
  camera: AkimatCameraFeed
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative bg-secondary/50 rounded-lg overflow-hidden group aspect-video"
    >
      {/* Simulated video feed */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background flex items-center justify-center">
        {camera.thumbnail === "road" && (
          <div className="w-full h-full relative">
            <div className="absolute inset-x-0 top-1/2 h-8 bg-muted-foreground/20" />
            <div className="absolute inset-y-0 left-1/2 w-1 bg-amber-500/30 -translate-x-1/2" style={{ height: "40%" }} />
            <div className="absolute bottom-4 left-4 w-3 h-2 bg-red-400/50 rounded animate-pulse" />
            <div className="absolute bottom-4 right-8 w-3 h-2 bg-blue-400/50 rounded" />
          </div>
        )}
        {camera.thumbnail === "street" && (
          <div className="w-full h-full relative">
            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-muted-foreground/10" />
            <div className="absolute top-4 left-4 w-4 h-6 bg-muted-foreground/20 rounded" />
            <div className="absolute top-4 right-6 w-4 h-6 bg-muted-foreground/20 rounded" />
            <div className="absolute bottom-6 left-1/3 w-2 h-3 bg-accent/30 rounded animate-pulse" />
          </div>
        )}
        {camera.thumbnail === "courtyard" && (
          <div className="w-full h-full relative">
            <div className="absolute inset-4 border border-muted-foreground/20 rounded" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-500/20" />
            <div className="absolute bottom-6 right-6 w-2 h-2 bg-accent/40 rounded-full animate-pulse" />
          </div>
        )}
        {camera.thumbnail === "building" && (
          <div className="w-full h-full relative">
            <div className="absolute bottom-0 inset-x-4 h-3/4 bg-muted-foreground/10 rounded-t" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-8 bg-muted-foreground/20" />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent/50 rounded-full animate-pulse" />
          </div>
        )}
        <Video className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/30" />
      </div>

      {/* Status indicator */}
      <div className={cn(
        "absolute top-2 left-2 w-2 h-2 rounded-full",
        statusColors[camera.status],
        camera.status === "online" && "animate-pulse"
      )} />

      {/* Camera info overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-xs font-medium text-white truncate">{camera.name}</p>
        <p className="text-xs text-white/60 truncate">{camera.location}</p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Maximize2 className="h-6 w-6 text-white" />
      </div>
    </button>
  )
}

type CamerasPanelProps = {
  cameras: AkimatCameraFeed[]
}

export function CamerasPanel({ cameras }: CamerasPanelProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCamera, setSelectedCamera] = useState<AkimatCameraFeed | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)

  const filteredCameras = cameras.filter((camera) => {
    const matchesSearch =
      camera.name.toLowerCase().includes(search.toLowerCase()) ||
      camera.location.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || camera.type === filter
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: cameras.length,
    online: cameras.filter((camera) => camera.status === 'online').length,
    offline: cameras.filter((camera) => camera.status === 'offline').length,
    maintenance: cameras.filter((camera) => camera.status === 'maintenance').length,
  }

  const currentIndex = selectedCamera
    ? filteredCameras.findIndex((camera) => camera.id === selectedCamera.id)
    : -1

  const goToNext = () => {
    if (currentIndex < filteredCameras.length - 1) {
      setSelectedCamera(filteredCameras[currentIndex + 1])
    }
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setSelectedCamera(filteredCameras[currentIndex - 1])
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Camera className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 text-xs text-white flex items-center justify-center">
            {stats.online}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[700px] sm:max-w-full p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-accent" />
            Smart City Cameras
          </SheetTitle>
        </SheetHeader>

        {selectedCamera ? (
          <div className="h-[calc(100vh-80px)] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <button
                onClick={() => setSelectedCamera(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to cameras
              </button>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  statusColors[selectedCamera.status]
                )} />
                <span className="text-sm capitalize">{selectedCamera.status}</span>
              </div>
            </div>

            {/* Video Feed */}
            <div className="flex-1 bg-black relative">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simulated live feed */}
                <div className="w-full h-full bg-black flex items-center justify-center relative">
                  {isPlaying ? (
                    <iframe 
                      src="https://rtsp.me/embed/KPbwo57M/" 
                      frameBorder="0" 
                      allowFullScreen 
                      className="w-full h-full absolute inset-0 border-none"
                    />
                  ) : (
                    <Video className="h-16 w-16 text-muted-foreground/30" />
                  )}
                  
                  {/* Timestamp */}
                  <div className="absolute top-4 left-4 bg-black/70 px-2 py-1 rounded text-xs text-white font-mono z-10 pointer-events-none">
                    {new Date().toLocaleTimeString()}
                  </div>

                  {/* Camera name */}
                  <div className="absolute top-4 right-4 bg-black/70 px-2 py-1 rounded text-xs text-white z-10 pointer-events-none">
                    {selectedCamera.name}
                  </div>

                  {/* REC indicator */}
                  {isPlaying && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 px-2 py-1 rounded z-10 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-white font-mono">LIVE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation arrows */}
              {currentIndex > 0 && (
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
              )}
              {currentIndex < filteredCameras.length - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">{selectedCamera.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedCamera.location}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Thumbnails strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {filteredCameras.slice(0, 6).map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => setSelectedCamera(camera)}
                    className={cn(
                      'flex-shrink-0 w-24 h-16 bg-secondary rounded overflow-hidden border-2 transition-colors',
                      selectedCamera.id === camera.id ? 'border-accent' : 'border-transparent',
                    )}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-secondary to-background flex items-center justify-center">
                      <Video className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 h-[calc(100vh-80px)] overflow-y-auto">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Cameras</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.online}</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.offline}</div>
                <div className="text-xs text-muted-foreground">Offline</div>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.maintenance}</div>
                <div className="text-xs text-muted-foreground">Maintenance</div>
              </div>
            </div>

            {/* Search and View Toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cameras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {typeFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors",
                    filter === f.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {filteredCameras.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No cameras found. Add camera-type assets in the database and they will appear here.
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredCameras.map((camera) => (
                      <CameraPreview
                        key={camera.id}
                        camera={camera}
                        onClick={() => setSelectedCamera(camera)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCameras.map((camera) => (
                      <button
                        key={camera.id}
                        onClick={() => setSelectedCamera(camera)}
                        className="w-full flex items-center gap-3 p-3 bg-card hover:bg-secondary/50 border border-border rounded-lg transition-colors"
                      >
                        <div className="w-20 h-12 bg-secondary rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                          <Video className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium truncate">{camera.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{camera.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', statusColors[camera.status])} />
                          <span className="text-xs text-muted-foreground capitalize">{camera.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

