import { useState } from "react"
import { 
  Search, 
  Mic, 
  MicOff,
  Navigation,
  Car,
  Footprints,
  Bike,
  Bus,
  X,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/utils/cn"

type TransportMode = "car" | "walk" | "bike" | "transit"

const transportModes: { mode: TransportMode; icon: React.ReactNode; label: string }[] = [
  { mode: "car", icon: <Car className="size-4" />, label: "Drive" },
  { mode: "walk", icon: <Footprints className="size-4" />, label: "Walk" },
  { mode: "bike", icon: <Bike className="size-4" />, label: "Bike" },
  { mode: "transit", icon: <Bus className="size-4" />, label: "Transit" },
]

export function RouteSearch() {
  const [destination, setDestination] = useState("")
  const [selectedMode, setSelectedMode] = useState<TransportMode>("car")
  const [isListening, setIsListening] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showRoute, setShowRoute] = useState(false)

  const handleVoiceInput = () => {
    setIsListening(!isListening)
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setDestination("Central Park")
        setIsListening(false)
      }, 2000)
    }
  }

  const handleSearch = () => {
    if (destination) {
      setIsSearching(true)
      setTimeout(() => {
        setIsSearching(false)
        setShowRoute(true)
      }, 1500)
    }
  }

  const clearRoute = () => {
    setDestination("")
    setShowRoute(false)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 z-30">
      <div className="max-w-2xl mx-auto space-y-3">
        {/* Route result */}
        {showRoute && (
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">Route to {destination}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={clearRoute}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-accent">12</p>
                <p className="text-xs text-muted-foreground">minutes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3.2</p>
                <p className="text-xs text-muted-foreground">km</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">Med</p>
                <p className="text-xs text-muted-foreground">traffic</p>
              </div>
            </div>
            <Button className="w-full mt-3 bg-accent text-accent-foreground hover:bg-accent/90">
              <Navigation className="size-4 mr-2" />
              Start Navigation
            </Button>
          </div>
        )}

        {/* Transport mode selector */}
        <div className="flex justify-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-full p-1 w-fit mx-auto">
          {transportModes.map(({ mode, icon, label }) => (
            <Button
              key={mode}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMode(mode)}
              className={cn(
                "rounded-full px-3 gap-1.5",
                selectedMode === mode 
                  ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {icon}
              <span className="hidden sm:inline text-xs">{label}</span>
            </Button>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-full p-2 shadow-lg">
          <div className="flex items-center flex-1 gap-2 px-2">
            <Search className="size-5 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Where do you want to go?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 px-0"
            />
            {destination && (
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => setDestination("")}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
          
          {/* Voice input button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVoiceInput}
            className={cn(
              "shrink-0 rounded-full",
              isListening 
                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500 animate-pulse" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            aria-label={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </Button>

          {/* Search button */}
          <Button
            onClick={handleSearch}
            disabled={!destination || isSearching}
            className="shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 px-4"
          >
            {isSearching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Navigation className="size-4" />
            )}
          </Button>
        </div>

        {/* Voice assistant indicator */}
        {isListening && (
          <div className="text-center">
            <p className="text-sm text-accent animate-pulse">Listening... Say your destination</p>
          </div>
        )}
      </div>
    </div>
  )
}

