import { useState } from "react"
import { Building2, ChevronDown, MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/utils/cn"

interface ScopeSelectorLiveProps {
  scope: string
  district: string | null
  districts: Array<{ id: string; name: string }>
  onScopeChange: (scope: string, district: string | null) => void
}

export function ScopeSelectorLive({
  scope,
  district,
  districts,
  onScopeChange,
}: ScopeSelectorLiveProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedDistrict = districts.find((item) => item.id === district) ?? null

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 border-border bg-card">
            {scope === "city" ? (
              <MapPin className="h-4 w-4 text-accent" />
            ) : (
              <Building2 className="h-4 w-4 text-accent" />
            )}
            <span>{scope === "city" ? "Entire City" : selectedDistrict?.name ?? "Select District"}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 border-border bg-card">
          <DropdownMenuItem
            onClick={() => {
              onScopeChange("city", null)
              setIsOpen(false)
            }}
          >
            <MapPin className="mr-2 h-4 w-4 text-accent" />
            Entire City
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {districts.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => {
                onScopeChange("district", item.id)
                setIsOpen(false)
              }}
              className={cn(district === item.id && "bg-accent/10")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              {item.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {scope !== "city" ? (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onScopeChange("city", null)}>
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}
