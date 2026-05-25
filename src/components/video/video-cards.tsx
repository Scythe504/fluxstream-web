'use client'

import { Card, CardHeader, CardTitle } from "../ui/card"
import { Play, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface VideoProps {
  videoId: string
  duration: number
  title: string
  view_progress: number
  processing: boolean
  onDelete?: (videoId: string) => void
}

export const VideoCard = ({ videoId, title, processing, onDelete }: VideoProps) => {
  const router = useRouter()

  const handleNavigate = () => {
    router.push(`/library/${videoId}`)
    if (processing) {
      toast.info("Processing Video", {
        description: "This video is still being prepared, but you can track its progress."
      })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
    const toastId = toast.loading("Deleting torrent media...")
    
    try {
      const res = await fetch(`${backendURL}/torrents/${videoId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_resource: true })
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to delete media")
      }

      toast.success("Torrent deleted successfully", { id: toastId })
      if (onDelete) {
        onDelete(videoId)
      }
    } catch (err) {
      console.error("Delete error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to delete torrent media"
      toast.error(errorMessage, { id: toastId })
    }
  }

  return (
    <Card
      onClick={handleNavigate}
      className="group relative flex flex-col h-full overflow-hidden transition-all hover:bg-accent/40 border border-border/50 cursor-pointer rounded-xl bg-card/50"
    >
      <CardHeader className="p-0 aspect-video bg-muted/30 flex items-center justify-center relative">
        {processing ? (
          <Play className="w-8 h-8 text-muted-foreground/60 animate-pulse" />
        ) : (
          <Play className="w-8 h-8 text-muted-foreground/60 group-hover:text-foreground transition-colors group-hover:scale-110 duration-200" />
        )}
      </CardHeader>
      
      <div className="flex items-center justify-between p-3 gap-2">
        <CardTitle className="text-sm font-semibold truncate text-foreground/90 flex-1 min-w-0">
          {title}
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDelete}
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
