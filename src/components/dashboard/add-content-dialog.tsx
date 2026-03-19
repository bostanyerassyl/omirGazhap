import { useState } from "react"
import { Plus, Users, MapPin, Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addFriendToMap, getMapCenterPosition } from "@/features/map/model/map-actions"

export function AddContentDialog() {
  const [open, setOpen] = useState(false)
  const [friendName, setFriendName] = useState("")
  const [friendAvatar, setFriendAvatar] = useState("")
  const [friendLatitude, setFriendLatitude] = useState("")
  const [friendLongitude, setFriendLongitude] = useState("")
  const [friendStatus, setFriendStatus] = useState<string | null>(null)
  const [placeData, setPlaceData] = useState({
    name: "",
    description: "",
    photos: [] as string[]
  })

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPlaceData(prev => ({ 
            ...prev, 
            photos: [...prev.photos, reader.result as string].slice(0, 4)
          }))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index: number) => {
    setPlaceData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleAddFriend = () => {
    const trimmedName = friendName.trim()
    if (!trimmedName) return
    setFriendStatus("Saving friend...")
    const lat = friendLatitude.trim() ? Number(friendLatitude) : undefined
    const lng = friendLongitude.trim() ? Number(friendLongitude) : undefined
    void addFriendToMap({
      name: trimmedName,
      avatarUrl: friendAvatar.trim() || undefined,
      latitude: Number.isFinite(lat) ? lat : undefined,
      longitude: Number.isFinite(lng) ? lng : undefined,
    }).then((result) => {
      if (!result.ok) {
        setFriendStatus(`Failed: ${result.error}`)
        return
      }
      setFriendStatus("Friend added to map")
      setFriendName("")
      setFriendAvatar("")
      setFriendLatitude("")
      setFriendLongitude("")
      setTimeout(() => setOpen(false), 500)
    })
  }

  const handleAddPlace = () => {
    if (placeData.name) {
      setPlaceData({ name: "", description: "", photos: [] })
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary"
          aria-label="Add content"
        >
          <Plus className="size-5 text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Contribute to Alatau</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add friends or share places to improve the city map
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="friends" className="mt-4">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="friends" className="flex-1">
              <Users className="size-4 mr-2" />
              Add Friend
            </TabsTrigger>
            <TabsTrigger value="places" className="flex-1">
              <MapPin className="size-4 mr-2" />
              Add Place
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="friend-name" className="text-foreground">
                Friend Name
              </Label>
              <Input
                id="friend-name"
                placeholder="e.g., Aisha"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="friend-avatar" className="text-foreground">
                Avatar URL (optional)
              </Label>
              <Input
                id="friend-avatar"
                placeholder="https://..."
                value={friendAvatar}
                onChange={(e) => setFriendAvatar(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="friend-lat" className="text-foreground">Latitude</Label>
                <Input
                  id="friend-lat"
                  placeholder="Auto from map center"
                  value={friendLatitude}
                  onChange={(e) => setFriendLatitude(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="friend-lng" className="text-foreground">Longitude</Label>
                <Input
                  id="friend-lng"
                  placeholder="Auto from map center"
                  value={friendLongitude}
                  onChange={(e) => setFriendLongitude(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const center = getMapCenterPosition()
                if (!center) {
                  setFriendStatus("Map center unavailable")
                  return
                }
                setFriendLatitude(center.latitude.toFixed(6))
                setFriendLongitude(center.longitude.toFixed(6))
              }}
            >
              Use Current Map Center
            </Button>

            {friendStatus && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{friendStatus}</p>
              </div>
            )}

            <Button 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleAddFriend}
              disabled={!friendName.trim()}
            >
              <Users className="size-4 mr-2" />
              Add Friend to Map
            </Button>
          </TabsContent>

          <TabsContent value="places" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="place-name" className="text-foreground">
                Place Name
              </Label>
              <Input
                id="place-name"
                placeholder="e.g., Cozy Coffee Shop"
                value={placeData.name}
                onChange={(e) => setPlaceData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place-desc" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="place-desc"
                placeholder="What makes this place special?"
                value={placeData.description}
                onChange={(e) => setPlaceData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-secondary border-border text-foreground min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Photos (up to 4)</Label>
              <div className="grid grid-cols-4 gap-2">
                {placeData.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 size-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="size-3 text-white" />
                    </button>
                  </div>
                ))}
                {placeData.photos.length < 4 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-accent transition-colors cursor-pointer flex items-center justify-center">
                    <Camera className="size-5 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleAddPlace}
              disabled={!placeData.name}
            >
              <MapPin className="size-4 mr-2" />
              Add to Map
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
