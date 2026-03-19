import { useState } from "react"
import { Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ObjectsList, mockObjects, type ConstructionObject } from "@/components/developer/objects-list"
import { ObjectEditor } from "@/components/developer/object-editor"
import { DeveloperMap } from "@/components/developer/developer-map"
import { DeveloperProfile } from "@/components/developer/developer-profile"

export default function DeveloperDashboard() {
  const [selectedObject, setSelectedObject] = useState<ConstructionObject | undefined>()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [objects, setObjects] = useState(mockObjects)
  const [reportSent, setReportSent] = useState(false)

  const handleSelectObject = (obj: ConstructionObject) => {
    setSelectedObject(obj)
    setIsEditorOpen(true)
  }

  const handleSaveObject = (updatedObj: ConstructionObject) => {
    setObjects(prev => prev.map(o => o.id === updatedObj.id ? updatedObj : o))
    setIsEditorOpen(false)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
  }

  const handleSendReport = async () => {
    setReportSent(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setReportSent(false)
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-background">
      {/* Map */}
      <DeveloperMap 
        objects={objects}
        selectedObject={selectedObject}
        onSelectObject={handleSelectObject}
      />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Profile & Objects */}
          <div className="flex items-center gap-3">
            <DeveloperProfile />
            <ObjectsList 
              onSelectObject={handleSelectObject}
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
            onClick={handleSendReport}
            disabled={reportSent}
          >
            {reportSent ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Sent!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Report to Akimat</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Object Editor Modal */}
      {isEditorOpen && selectedObject && (
        <ObjectEditor
          object={selectedObject}
          onClose={handleCloseEditor}
          onSave={handleSaveObject}
        />
      )}

      {/* Bottom instruction */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-sm text-muted-foreground">
          Click on any building marker to edit its information
        </div>
      </div>
    </div>
  )
}

