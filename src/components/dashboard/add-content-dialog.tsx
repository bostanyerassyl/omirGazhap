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

export function AddContentDialog() {
  const [open, setOpen] = useState(false)
  const [friendSearch, setFriendSearch] = useState("")
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
    if (friendSearch) {
      setFriendSearch("")
      setOpen(false)
    }
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
              <Label htmlFor="friend-search" className="text-foreground">
                Find by username or phone
              </Label>
              <Input
                id="friend-search"
                placeholder="Enter username or phone number"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            
            {friendSearch && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Searching for &quot;{friendSearch}&quot;...
                </p>
              </div>
            )}

            <Button 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleAddFriend}
              disabled={!friendSearch}
            >
              <Users className="size-4 mr-2" />
              Send Friend Request
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

