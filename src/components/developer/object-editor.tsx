import { useState } from "react"
import {
  X,
  Building2,
  MapPin,
  Calendar,
  Phone,
  FileText,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  onSave: (obj: ConstructionObject) => Promise<void> | void
  mode?: "create" | "edit"
}

export function ObjectEditor({
  object,
  onClose,
  onSave,
  mode = "edit",
}: ObjectEditorProps) {
  const [formData, setFormData] = useState({
    type: object.type,
    name: object.name,
    address: object.address,
    description: object.description,
    contactPhone: object.contactPhone,
    developerName: object.developerName,
    status: object.status,
    deadline: object.deadline,
    progress: object.progress,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onSave({
      ...object,
      type: formData.type,
      name: formData.name.trim(),
      address: formData.address.trim(),
      description: formData.description.trim(),
      contactPhone: formData.contactPhone.trim(),
      developerName: formData.developerName.trim(),
      status: formData.status,
      deadline: formData.deadline,
      progress: Math.max(0, Math.min(100, formData.progress)),
    })
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
              <h2 className="font-semibold text-foreground">
                {mode === "create" ? "New Construction Object" : object.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "create" ? "Create a new tracked project in the developer registry." : object.address}
              </p>
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
              value="reports" 
              className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-accent"
            >
              Reports
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
                    <FieldLabel>Object Type</FieldLabel>
                    <Input
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="bg-input border-border"
                    />
                  </Field>
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
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
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
                  <FieldLabel>Progress</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.progress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        progress: Number(e.target.value || 0),
                      })
                    }
                    className="bg-input border-border"
                  />
                </Field>

                <Field>
                  <FieldLabel>Developer Name</FieldLabel>
                  <Input
                    value={formData.developerName}
                    disabled
                    className="bg-input border-border opacity-70"
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

            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-0 space-y-3">
              {object.reports.length ? (
                object.reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border"
                  >
                    <div className="h-10 w-10 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{report.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.date} - {report.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <p className="text-sm font-medium text-foreground">No related reports yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reports to Akimat will appear here after they are submitted for this object.
                  </p>
                </div>
              )}
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

