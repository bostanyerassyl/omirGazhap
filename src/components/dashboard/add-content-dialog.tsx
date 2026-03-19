import { useState } from "react"
import { Plus, Users, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusMessage } from "@/components/ui/status-message"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  addFriendToMap,
  addPoiToMap,
  getMapCenterPosition,
  pickPointOnMap,
  type PoiCategory,
} from "@/features/map/model/map-actions"

type AddContentDialogProps = {
  locationOptions: Array<{ id: string; name: string }>
  onAddPlace: (payload: {
    name: string
    description: string
    locationId?: string | null
    photosCount?: number
  }) => Promise<void>
}

export function AddContentDialog({
  locationOptions,
  onAddPlace,
}: AddContentDialogProps) {
  const [open, setOpen] = useState(false)
  const [friendName, setFriendName] = useState("")
  const [friendAvatar, setFriendAvatar] = useState("")
  const [friendLatitude, setFriendLatitude] = useState("")
  const [friendLongitude, setFriendLongitude] = useState("")
  const [friendStatus, setFriendStatus] = useState<string | null>(null)
  const [submittingPlace, setSubmittingPlace] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [placeSuccess, setPlaceSuccess] = useState<string | null>(null)
  const [placeData, setPlaceData] = useState({
    category: "events" as PoiCategory,
    name: "",
    latitude: "",
    longitude: "",
    description: "",
    locationId: "",
    photos: [] as string[],
    status: null as string | null,
  })

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

  const handleAddPlace = async () => {
    const trimmedName = placeData.name.trim()
    if (!trimmedName) return

    setSubmittingPlace(true)
    setPlaceError(null)
    setPlaceSuccess(null)
    setPlaceData((prev) => ({ ...prev, status: "Saving place..." }))
    const lat = placeData.latitude.trim() ? Number(placeData.latitude) : undefined
    const lng = placeData.longitude.trim() ? Number(placeData.longitude) : undefined

    try {
      await onAddPlace({
        name: trimmedName,
        description: placeData.description,
        locationId: placeData.locationId || null,
        photosCount: placeData.photos.length,
      })

      const result = await addPoiToMap({
        category: placeData.category,
        name: trimmedName,
        description: placeData.description.trim() || undefined,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
      })

      if (!result.ok) {
        setPlaceData((prev) => ({
          ...prev,
          status: `Saved to database, but map marker failed: ${result.error}`,
        }))
        return
      }

      setPlaceData({
        category: "events",
        name: "",
        latitude: "",
        longitude: "",
        description: "",
        locationId: "",
        photos: [],
        status: "Point added to map",
      })
      setPlaceSuccess("Place submitted successfully.")
      setTimeout(() => setOpen(false), 500)
    } catch (error) {
      setPlaceError(error instanceof Error ? error.message : "Unable to add place.")
      setPlaceData((prev) => ({ ...prev, status: "Failed to save place" }))
    } finally {
      setSubmittingPlace(false)
    }
  }

  const handlePickOnMapAndAdd = async () => {
    const trimmedName = placeData.name.trim()
    if (!trimmedName) {
      setPlaceData((prev) => ({ ...prev, status: "Enter place name first" }))
      return
    }
    setSubmittingPlace(true)
    setPlaceError(null)
    setPlaceSuccess(null)
    setPlaceData((prev) => ({ ...prev, status: "Click anywhere on the map to place this point..." }))
    setOpen(false)
    const picked = await pickPointOnMap()
    if (!picked.ok || !Number.isFinite(picked.latitude) || !Number.isFinite(picked.longitude)) {
      setOpen(true)
      setSubmittingPlace(false)
      setPlaceData((prev) => ({ ...prev, status: `Placement failed: ${picked.error ?? "Unknown error"}` }))
      return
    }

    try {
      await onAddPlace({
        name: trimmedName,
        description: placeData.description,
        locationId: placeData.locationId || null,
        photosCount: placeData.photos.length,
      })

      const result = await addPoiToMap({
        category: placeData.category,
        name: trimmedName,
        description: placeData.description.trim() || undefined,
        latitude: picked.latitude,
        longitude: picked.longitude,
      })
      if (!result.ok) {
        setOpen(true)
        setPlaceData((prev) => ({
          ...prev,
          status: `Saved to database, but map marker failed: ${result.error}`,
        }))
        return
      }
      setPlaceData({
        category: "events",
        name: "",
        latitude: "",
        longitude: "",
        description: "",
        locationId: "",
        photos: [],
        status: "Point added where you clicked",
      })
      setPlaceSuccess("Place submitted successfully.")
    } catch (error) {
      setOpen(true)
      setPlaceError(error instanceof Error ? error.message : "Unable to add place.")
      setPlaceData((prev) => ({ ...prev, status: "Failed to save place" }))
    } finally {
      setSubmittingPlace(false)
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
            {placeError ? <StatusMessage tone="error">{placeError}</StatusMessage> : null}
            {placeSuccess ? <StatusMessage tone="success">{placeSuccess}</StatusMessage> : null}
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
              <Label className="text-foreground">Location</Label>
              <Select
                value={placeData.locationId}
                onValueChange={(value) =>
                  setPlaceData((prev) => ({ ...prev, locationId: value }))
                }
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Choose location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="place-category" className="text-foreground">
                Category
              </Label>
              <select
                id="place-category"
                value={placeData.category}
                onChange={(e) => setPlaceData((prev) => ({ ...prev, category: e.target.value as PoiCategory }))}
                className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
              >
                <option value="ramps">Ramp</option>
                <option value="scooters">Scooter</option>
                <option value="events">Event</option>
                <option value="buses">Bus Stop</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="place-lat" className="text-foreground">Latitude</Label>
                <Input
                  id="place-lat"
                  placeholder="Auto from map center"
                  value={placeData.latitude}
                  onChange={(e) => setPlaceData((prev) => ({ ...prev, latitude: e.target.value }))}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="place-lng" className="text-foreground">Longitude</Label>
                <Input
                  id="place-lng"
                  placeholder="Auto from map center"
                  value={placeData.longitude}
                  onChange={(e) => setPlaceData((prev) => ({ ...prev, longitude: e.target.value }))}
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
                  setPlaceData((prev) => ({ ...prev, status: "Map center unavailable" }))
                  return
                }
                setPlaceData((prev) => ({
                  ...prev,
                  latitude: center.latitude.toFixed(6),
                  longitude: center.longitude.toFixed(6),
                }))
              }}
            >
              Use Current Map Center
            </Button>

            {placeData.status && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{placeData.status}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => void handlePickOnMapAndAdd()}
                disabled={!placeData.name.trim() || submittingPlace}
              >
                <MapPin className="size-4 mr-2" />
                {submittingPlace ? "Submitting..." : "Pick on Map and Add"}
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => void handleAddPlace()}
                disabled={!placeData.name.trim() || submittingPlace}
              >
                {submittingPlace ? "Submitting..." : "Add Using Coordinates"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
