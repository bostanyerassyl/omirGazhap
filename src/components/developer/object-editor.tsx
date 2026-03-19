import { useState } from "react"
import { 
  X, 
  Building2, 
  MapPin, 
  Calendar, 
  Phone,
  Upload,
  Image as ImageIcon,
  FileText,
  Accessibility,
  Cpu,
  Save,
  Trash2,
  Plus,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ConstructionObject } from "@/types/dashboard"

interface ObjectEditorProps {
  object: ConstructionObject
  onClose: () => void
  onSave: (obj: ConstructionObject) => void
}

const mockPhotos = [
  "/placeholder.svg?height=200&width=300",
  "/placeholder.svg?height=200&width=300",
  "/placeholder.svg?height=200&width=300",
]

const mockReports = [
  { id: "1", name: "Q1 2026 Progress Report.pdf", date: "2026-03-15", size: "2.4 MB" },
  { id: "2", name: "Safety Inspection Feb 2026.pdf", date: "2026-02-28", size: "1.8 MB" },
  { id: "3", name: "Environmental Assessment.pdf", date: "2026-01-10", size: "3.2 MB" },
]

const inclusivityFeatures = [
  { id: "ramps", label: "Wheelchair Ramps", enabled: true },
  { id: "elevators", label: "Accessible Elevators", enabled: true },
  { id: "parking", label: "Disabled Parking", enabled: true },
  { id: "signage", label: "Braille Signage", enabled: false },
  { id: "audio", label: "Audio Guidance System", enabled: false },
  { id: "tactile", label: "Tactile Paving", enabled: true },
]

const smartTechnologies = [
  { id: "energy", label: "Smart Energy Management", enabled: true },
  { id: "security", label: "AI Security System", enabled: true },
  { id: "parking-smart", label: "Smart Parking System", enabled: false },
  { id: "hvac", label: "Intelligent HVAC", enabled: true },
  { id: "lighting", label: "Automated Lighting", enabled: true },
  { id: "waste", label: "Smart Waste Management", enabled: false },
  { id: "ev-charging", label: "EV Charging Stations", enabled: true },
  { id: "water", label: "Water Recycling System", enabled: false },
]

export function ObjectEditor({ object, onClose, onSave }: ObjectEditorProps) {
  const [formData, setFormData] = useState({
    name: object.name,
    address: object.address,
    status: object.status,
    deadline: object.deadline,
    description: "Modern mixed-use development featuring residential and commercial spaces with cutting-edge smart city integration.",
    phone: "+7 (727) 123-4567",
    developerName: "Alatau Development Corp",
  })
  
  const [inclusivity, setInclusivity] = useState(inclusivityFeatures)
  const [smartTech, setSmartTech] = useState(smartTechnologies)
  const [isSaving, setIsSaving] = useState(false)

  const toggleFeature = (id: string, type: "inclusivity" | "smart") => {
    if (type === "inclusivity") {
      setInclusivity(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
    } else {
      setSmartTech(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onSave({ ...object, ...formData })
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{object.name}</h2>
              <p className="text-sm text-muted-foreground">{object.address}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start px-4 pt-2 bg-transparent border-b border-border rounded-none h-auto gap-1">
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent"
            >
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="photos" 
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent"
            >
              Photos
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger 
              value="inclusivity" 
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent"
            >
              Inclusivity
            </TabsTrigger>
            <TabsTrigger 
              value="smart" 
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent"
            >
              Smart Tech
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-0 space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>Object Name</FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-border"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Address</FieldLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel>Contact Phone</FieldLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as ConstructionObject["status"] })}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Deadline</FieldLabel>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Developer Name</FieldLabel>
                  <Input
                    value={formData.developerName}
                    onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                    className="bg-input border-border"
                  />
                </Field>

                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-input border-border min-h-[100px]"
                    placeholder="Describe the construction project..."
                  />
                </Field>
              </FieldGroup>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {mockPhotos.map((photo, index) => (
                  <div key={index} className="relative aspect-video bg-secondary rounded-lg overflow-hidden group">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <button className="absolute top-2 right-2 h-7 w-7 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                <button className="aspect-video bg-secondary/50 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-accent/50 hover:bg-secondary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload Photo</span>
                </button>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-0 space-y-3">
              {mockReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border"
                >
                  <div className="h-10 w-10 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.date} - {report.size}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <button className="w-full p-4 bg-secondary/30 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 hover:border-accent/50 hover:bg-secondary/50 transition-colors">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Upload Report</span>
              </button>
            </TabsContent>

            {/* Inclusivity Tab */}
            <TabsContent value="inclusivity" className="mt-0">
              <div className="flex items-center gap-2 mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                <Accessibility className="h-5 w-5 text-accent" />
                <p className="text-sm text-foreground">Configure accessibility features for this building</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inclusivity.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id, "inclusivity")}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      feature.enabled
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-secondary/50 border-border hover:border-accent/30"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      feature.enabled ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"
                    }`}>
                      {feature.enabled && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <span className={feature.enabled ? "text-foreground" : "text-muted-foreground"}>
                      {feature.label}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* Smart Tech Tab */}
            <TabsContent value="smart" className="mt-0">
              <div className="flex items-center gap-2 mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                <Cpu className="h-5 w-5 text-accent" />
                <p className="text-sm text-foreground">Smart technologies integrated into this building</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {smartTech.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => toggleFeature(tech.id, "smart")}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      tech.enabled
                        ? "bg-accent/10 border-accent/30"
                        : "bg-secondary/50 border-border hover:border-accent/30"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      tech.enabled ? "border-accent bg-accent" : "border-muted-foreground"
                    }`}>
                      {tech.enabled && <CheckCircle2 className="h-3 w-3 text-accent-foreground" />}
                    </div>
                    <span className={tech.enabled ? "text-foreground" : "text-muted-foreground"}>
                      {tech.label}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-card">
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

