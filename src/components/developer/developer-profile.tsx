"use client"

import { useState } from "react"
import { 
  User, 
  Camera, 
  Mail, 
  Phone, 
  Building2, 
  MapPin,
  FileText,
  Save,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function DeveloperProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: "Alatau Development Corp",
    email: "contact@alataudev.kz",
    phone: "+7 (727) 123-4567",
    companyName: "Alatau Development Corporation",
    address: "15 Business Center Avenue, Almaty",
    licenseNumber: "DEV-2024-00123",
    bio: "Leading construction and development company specializing in smart city infrastructure and sustainable building solutions.",
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setIsEditing(false)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="h-10 w-10 rounded-full bg-card border border-border hover:border-accent/50 transition-colors flex items-center justify-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder.svg" alt="Developer" />
            <AvatarFallback className="bg-accent/20 text-accent text-sm font-medium">
              AD
            </AvatarFallback>
          </Avatar>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md bg-background border-border p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            Developer Profile
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-accent/30">
                <AvatarImage src="/placeholder.svg" alt="Developer" />
                <AvatarFallback className="bg-accent/20 text-accent text-2xl font-medium">
                  AD
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 h-8 w-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-3 text-lg font-medium text-foreground">{profile.companyName}</h3>
            <p className="text-sm text-muted-foreground">Developer Account</p>
          </div>

          {/* Profile Form */}
          <FieldGroup>
            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Company Name
              </FieldLabel>
              <Input
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                disabled={!isEditing}
                className="bg-input border-border disabled:opacity-70"
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Contact Person
              </FieldLabel>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                disabled={!isEditing}
                className="bg-input border-border disabled:opacity-70"
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </FieldLabel>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className="bg-input border-border disabled:opacity-70"
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone
              </FieldLabel>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
                className="bg-input border-border disabled:opacity-70"
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Address
              </FieldLabel>
              <Input
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                disabled={!isEditing}
                className="bg-input border-border disabled:opacity-70"
              />
            </Field>

            <Field>
              <FieldLabel className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                License Number
              </FieldLabel>
              <Input
                value={profile.licenseNumber}
                disabled
                className="bg-input border-border opacity-70"
              />
            </Field>

            <Field>
              <FieldLabel>About Company</FieldLabel>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!isEditing}
                className="bg-input border-border min-h-[80px] disabled:opacity-70"
              />
            </Field>
          </FieldGroup>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-accent">5</p>
              <p className="text-xs text-muted-foreground">Active Projects</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-emerald-400">12</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-foreground">4.8</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1 border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Edit Profile
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

