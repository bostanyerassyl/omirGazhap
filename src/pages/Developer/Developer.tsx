import { useMemo, useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import { ObjectsList } from "@/components/developer/objects-list"
import { ObjectEditor } from "@/components/developer/object-editor"
import { DeveloperMap } from "@/components/developer/developer-map"
import { DeveloperProfile } from "@/components/developer/developer-profile"
import { useDashboardData } from "@/features/dashboard/model/useDashboardData"
import { useAuth } from "@/features/auth/model/AuthProvider"
import type { ConstructionObject } from "@/types/dashboard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function createDraftObject(developerName: string, phone: string): ConstructionObject {
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 90)

  return {
    id: `draft-${Date.now()}`,
    locationId: null,
    type: "residential complex",
    name: "",
    address: "",
    description: "",
    contactPhone: phone,
    developerName,
    status: "planning",
    deadline: deadline.toISOString().slice(0, 10),
    progress: 0,
    coordinates: {
      lat: 43.238949,
      lng: 76.889709,
    },
    reports: [],
  }
}

export default function DeveloperDashboard() {
  const {
    data,
    loading,
    error,
    reloadData,
    saveDeveloperObject,
    createDeveloperObject,
    reportDeveloperObject,
  } = useDashboardData("developer")
  const { profile } = useAuth()
  const [selectedObject, setSelectedObject] = useState<ConstructionObject | undefined>()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<"create" | "edit">("edit")
  const [reportOpen, setReportOpen] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportSuccess, setReportSuccess] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  const [savingObject, setSavingObject] = useState(false)
  const [objectError, setObjectError] = useState<string | null>(null)
  const [reportForm, setReportForm] = useState({
    objectId: "",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  const objects = data?.objects ?? []
  const developerName =
    profile?.companyName || profile?.fullName || "Developer account"
  const developerPhone = profile?.phone || ""

  const handleSelectObject = (obj: ConstructionObject) => {
    setEditorMode("edit")
    setSelectedObject(obj)
    setObjectError(null)
    setIsEditorOpen(true)
  }

  const handleAddObject = () => {
    setEditorMode("create")
    setSelectedObject(createDraftObject(developerName, developerPhone))
    setObjectError(null)
    setIsEditorOpen(true)
  }

  const handleSaveObject = async (updatedObj: ConstructionObject) => {
    if (!updatedObj.name.trim() || !updatedObj.type.trim()) {
      setObjectError("Object name and type are required.")
      return
    }

    setSavingObject(true)
    setObjectError(null)
    const result =
      editorMode === "create"
        ? await createDeveloperObject(updatedObj)
        : await saveDeveloperObject(updatedObj)
    setSavingObject(false)

    if (result.error) {
      setObjectError(result.error.message)
      return
    }

    setSelectedObject(updatedObj)
    setIsEditorOpen(false)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setObjectError(null)
  }

  const handleSendReport = async () => {
    if (!reportForm.objectId || !reportForm.title.trim() || !reportForm.description.trim()) {
      setReportError("Select an object, add a title, and describe the issue before sending.")
      return
    }

    setReporting(true)
    setReportError(null)
    setReportSuccess(null)
    const result = await reportDeveloperObject({
      objectId: reportForm.objectId,
      title: reportForm.title.trim(),
      description: reportForm.description.trim(),
      priority: reportForm.priority,
    })
    setReporting(false)

    if (result.error) {
      setReportError(result.error.message)
      return
    }

    setReportSuccess("Report sent to Akimat.")
    setReportForm({
      objectId: "",
      title: "",
      description: "",
      priority: "medium",
    })
    setReportOpen(false)
  }

  const selectedReportObject = useMemo(
    () => objects.find((item) => item.id === reportForm.objectId) ?? null,
    [objects, reportForm.objectId],
  )

  return (
    <div className="h-screen w-full relative overflow-hidden bg-background">
      {loading ? <div /> : null}
      {/* Map */}
      <DeveloperMap 
        objects={objects}
        selectedObject={selectedObject}
        onSelectObject={handleSelectObject}
      />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex flex-col gap-3">
          {error ? (
            <StatusMessage tone="error" className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void reloadData()}>
                Retry
              </Button>
            </StatusMessage>
          ) : null}
          <div className="flex items-center justify-between">
          {/* Left side - Profile & Objects */}
            <div className="flex items-center gap-3">
              <DeveloperProfile objects={objects} />
              <ObjectsList 
                objects={objects}
                onSelectObject={handleSelectObject}
                onAddObject={handleAddObject}
                selectedObjectId={selectedObject?.id}
              />
            </div>

            {/* Center - Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-semibold text-foreground tracking-tight">Alatau</span>
                <span className="text-xs text-muted-foreground ml-1">Developer Portal</span>
              </div>
            </div>

            {/* Right side - Report to Akimat */}
            <Button
              variant="default"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => {
                setReportError(null)
                setReportSuccess(null)
                setReportOpen(true)
              }}
              disabled={!objects.length}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Report to Akimat</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Object Editor Modal */}
      {isEditorOpen && selectedObject && (
        <>
          {objectError ? (
            <div className="absolute top-20 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 px-4">
              <StatusMessage tone="error">{objectError}</StatusMessage>
            </div>
          ) : null}
          <ObjectEditor
            object={selectedObject}
            onClose={handleCloseEditor}
            onSave={handleSaveObject}
            mode={editorMode}
          />
        </>
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report to Akimat</DialogTitle>
            <DialogDescription>
              Submit a tracked issue for one of your construction objects. This creates a real event and case in the city workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reportError ? <StatusMessage tone="error">{reportError}</StatusMessage> : null}
            {reportSuccess ? <StatusMessage tone="success">{reportSuccess}</StatusMessage> : null}
            <FieldGroup>
              <Field>
                <FieldLabel>Construction Object</FieldLabel>
                <Select
                  value={reportForm.objectId}
                  onValueChange={(value) => setReportForm((current) => ({ ...current, objectId: value }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select object" />
                  </SelectTrigger>
                  <SelectContent>
                    {objects.map((object) => (
                      <SelectItem key={object.id} value={object.id}>
                        {object.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Report Title</FieldLabel>
                <Input
                  value={reportForm.title}
                  onChange={(event) =>
                    setReportForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="bg-input border-border"
                  placeholder="Example: Permit review delay"
                />
              </Field>

              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select
                  value={reportForm.priority}
                  onValueChange={(value) =>
                    setReportForm((current) => ({
                      ...current,
                      priority: value as "low" | "medium" | "high",
                    }))
                  }
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={reportForm.description}
                  onChange={(event) =>
                    setReportForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="bg-input border-border min-h-[120px]"
                  placeholder={
                    selectedReportObject
                      ? `Describe what Akimat should review for ${selectedReportObject.name}.`
                      : "Describe the issue or request for Akimat."
                  }
                />
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSendReport()}
              disabled={reporting || savingObject}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {reporting ? "Sending..." : "Send Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom instruction */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-sm text-muted-foreground">
          Click on any building marker to edit its information
        </div>
      </div>
    </div>
  )
}

