import { useEffect, useState } from "react"
import { Camera, Mail, Phone, MapPin, Save, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/features/auth/model/AuthProvider"

interface UserProfile {
  name: string
  email: string
  phone: string
  address: string
  bio: string
  avatar: string
}

export function ProfileSheet() {
  const { profile: authProfile, updateProfile } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    name: "Citizen User",
    email: "user@alatau.city",
    phone: "+7 (700) 123-4567",
    address: "Alatau District, Block 5",
    bio: "Resident of Alatau Smart City",
    avatar: ""
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!authProfile) {
      return
    }

    setProfile({
      name: authProfile.fullName,
      email: authProfile.email,
      phone: authProfile.phone,
      address: authProfile.address,
      bio: authProfile.bio,
      avatar: authProfile.avatarUrl,
    })
  }, [authProfile])

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    await updateProfile({
      fullName: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      bio: profile.bio,
      avatarUrl: profile.avatar,
    })
    setIsSaving(false)
    setIsEditing(false)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 px-2 hover:bg-secondary"
        >
          <Avatar className="size-8 border-2 border-accent">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              {profile.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm font-medium">{profile.name}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-foreground">My Profile</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Manage your personal information
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="size-24 border-4 border-accent">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="bg-secondary text-foreground text-2xl">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex items-center justify-center size-8 rounded-full bg-accent text-accent-foreground cursor-pointer hover:bg-accent/90 transition-colors"
              >
                <Camera className="size-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Click camera to upload photo</p>
          </div>

          {/* Profile form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground flex items-center gap-2">
                <User className="size-4 text-accent" />
                Full Name
              </Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                <Mail className="size-4 text-accent" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                disabled={!isEditing}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground flex items-center gap-2">
                <Phone className="size-4 text-accent" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                disabled={!isEditing}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground flex items-center gap-2">
                <MapPin className="size-4 text-accent" />
                Address
              </Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                disabled={!isEditing}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground">About Me</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!isEditing}
                className="bg-secondary border-border text-foreground min-h-[100px] resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1 border-border text-foreground hover:bg-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="size-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

