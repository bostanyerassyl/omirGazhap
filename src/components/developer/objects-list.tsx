import { useState } from "react"
import { 
  Building2, 
  MapPin, 
  Calendar, 
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { ConstructionObject } from "@/types/dashboard"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const statusConfig = {
  "planning": { label: "Planning", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  "in-progress": { label: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  "completed": { label: "Completed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  "delayed": { label: "Delayed", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
}

interface ObjectsListProps {
  objects: ConstructionObject[]
  onSelectObject: (obj: ConstructionObject) => void
  selectedObjectId?: string
}

export function ObjectsList({
  objects,
  onSelectObject,
  selectedObjectId,
}: ObjectsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredObjects = objects.filter(obj =>
    obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (obj: ConstructionObject) => {
    onSelectObject(obj)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 px-4 bg-card/80 border-border hover:bg-card hover:border-accent/50 text-foreground"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Objects
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md bg-background border-border p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            My Construction Objects
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search objects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-220px)]">
          {filteredObjects.map((obj) => {
            const status = statusConfig[obj.status]
            const StatusIcon = status.icon
            const isSelected = selectedObjectId === obj.id
            
            return (
              <button
                key={obj.id}
                onClick={() => handleSelect(obj)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected 
                    ? "bg-accent/10 border-accent/50" 
                    : "bg-card border-border hover:border-accent/30 hover:bg-card/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{obj.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{obj.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>Deadline: {new Date(obj.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
                
                <div className="mt-3 flex items-center gap-3">
                  <Badge variant="outline" className={`${status.color} border`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${obj.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{obj.progress}%</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-border">
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New Object
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

