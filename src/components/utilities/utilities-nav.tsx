import { Zap, Droplets, Flame, Bus, CalendarDays } from "lucide-react"
import { cn } from "@/utils/cn"

interface UtilitiesNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "electricity", label: "Electricity", icon: Zap, color: "text-yellow-400" },
  { id: "water", label: "Water", icon: Droplets, color: "text-blue-400" },
  { id: "gas", label: "Gas", icon: Flame, color: "text-orange-400" },
  { id: "transport", label: "Transport", icon: Bus, color: "text-green-400" },
  { id: "events", label: "Events", icon: CalendarDays, color: "text-accent" },
]

export function UtilitiesNav({ activeTab, onTabChange }: UtilitiesNavProps) {
  return (
    <nav className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              isActive 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive && tab.color)} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

