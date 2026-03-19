import { useEffect, useState } from 'react'
import { Camera, Mail, MapPin, Phone, Save, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusMessage } from '@/components/ui/status-message'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/model/AuthProvider'
import { storageService } from '@/services/domain/storageService'

type AkimatProfileSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AkimatProfileForm = {
  name: string
  email: string
  phone: string
  address: string
  bio: string
  avatar: string
}

export function AkimatProfileSheet({
  open,
  onOpenChange,
}: AkimatProfileSheetProps) {
  const { user, profile: authProfile, updateEmail, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<AkimatProfileForm>({
    name: 'Akimat Administrator',
    email: 'admin@alatau.gov.kz',
    phone: '',
    address: '',
    bio: '',
    avatar: '',
  })

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file || !user) {
      return
    }

    setSaveError(null)
    setSaveSuccess(null)
    setIsUploadingAvatar(true)

    const uploadResult = await storageService.uploadAvatar(user.id, file)

    setIsUploadingAvatar(false)
    event.target.value = ''

    if (uploadResult.error) {
      setSaveError(uploadResult.error.message)
      return
    }

    setProfile((current) => ({
      ...current,
      avatar: uploadResult.data ?? current.avatar,
    }))
    setSaveSuccess('Avatar uploaded. Save the profile to persist the change.')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    const emailChanged = profile.email !== (authProfile?.email ?? '')

    if (emailChanged) {
      const emailResult = await updateEmail(profile.email)

      if (emailResult.error) {
        setIsSaving(false)
        setSaveError(emailResult.error.message)
        return
      }
    }

    const result = await updateProfile({
      fullName: profile.name,
      phone: profile.phone,
      address: profile.address,
      bio: profile.bio,
      avatarUrl: profile.avatar,
    })

    setIsSaving(false)

    if (result.error) {
      setSaveError(result.error.message)
      return
    }

    setSaveSuccess(
      emailChanged
        ? 'Profile saved. Check your inbox if email confirmation is required.'
        : 'Profile saved successfully.',
    )
    setIsEditing(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          setIsEditing(false)
          setSaveError(null)
          setSaveSuccess(null)
        }
      }}
    >
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Akimat Profile</SheetTitle>
          <SheetDescription>
            Manage your administrator profile information.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6 px-4 pb-6">
          {saveError ? <StatusMessage tone="error">{saveError}</StatusMessage> : null}
          {saveSuccess ? <StatusMessage tone="success">{saveSuccess}</StatusMessage> : null}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="size-24 border-4 border-accent">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="bg-secondary text-foreground text-2xl">
                  {profile.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="akimat-avatar-upload"
                className="absolute bottom-0 right-0 flex items-center justify-center size-8 rounded-full bg-accent text-accent-foreground cursor-pointer hover:bg-accent/90 transition-colors"
              >
                <Camera className="size-4" />
                <input
                  id="akimat-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    void handleAvatarUpload(event)
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {isUploadingAvatar ? 'Uploading avatar...' : 'Click camera to upload photo'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="akimat-name" className="flex items-center gap-2">
                <User className="size-4 text-accent" />
                Full Name
              </Label>
              <Input
                id="akimat-name"
                value={profile.name}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, name: event.target.value }))
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="akimat-email" className="flex items-center gap-2">
                <Mail className="size-4 text-accent" />
                Email
              </Label>
              <Input
                id="akimat-email"
                type="email"
                value={profile.email}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, email: event.target.value }))
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="akimat-phone" className="flex items-center gap-2">
                <Phone className="size-4 text-accent" />
                Phone
              </Label>
              <Input
                id="akimat-phone"
                value={profile.phone}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, phone: event.target.value }))
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="akimat-address" className="flex items-center gap-2">
                <MapPin className="size-4 text-accent" />
                Address
              </Label>
              <Input
                id="akimat-address"
                value={profile.address}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, address: event.target.value }))
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="akimat-bio">About</Label>
              <Textarea
                id="akimat-bio"
                value={profile.bio}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, bio: event.target.value }))
                }
                disabled={!isEditing}
                className="min-h-[110px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsEditing(false)
                    setSaveError(null)
                    setSaveSuccess(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => void handleSave()}
                  disabled={isSaving || isUploadingAvatar}
                >
                  <Save className="size-4 mr-2" />
                  {isSaving ? 'Saving...' : isUploadingAvatar ? 'Uploading...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
