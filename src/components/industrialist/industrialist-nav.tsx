import { Factory, Leaf, TrendingUp, DollarSign } from "lucide-react"
import { cn } from "@/utils/cn"

interface IndustrialistNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "emissions", label: "Emissions & Pollution", icon: Leaf },
  { id: "production", label: "Production Volume", icon: Factory },
  { id: "finances", label: "Profit & Expenses", icon: DollarSign },
]

export function IndustrialistNav({ activeTab, onTabChange }: IndustrialistNavProps) {
  return (
    <nav className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

