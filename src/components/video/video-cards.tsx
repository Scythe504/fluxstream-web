'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Download, Play, Video } from "lucide-react"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface VideoProps {
  videoId: string
  duration: number
  title: string
  view_progress: number
  processing: boolean
}

export const VideoCard = ({ videoId, title, processing }: VideoProps) => {
  const router = useRouter()

  const handleNavigate = () => {
    router.push(`/library/${videoId}`)
    if (processing) {
      toast.info("Processing Video", {
        description: "This video is still being prepared, but you can track its progress."
      })
    }
  }

  return (
    <Card
      onClick={handleNavigate}
      className="group relative flex flex-col h-full overflow-hidden transition-all hover:bg-accent/50 cursor-pointer"
    >
      <CardHeader className="p-0 aspect-video bg-muted flex items-center justify-center">
        {processing ? (
          <Download className="w-10 h-10 text-muted-foreground animate-pulse" />
        ) : (
          <Video className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight">
          {title}
        </CardTitle>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {processing ? "Downloading..." : "Ready to watch"}
        </div>
        <Button size="icon" variant={processing ? "outline" : "default"} className="h-8 w-8 rounded-full">
          {processing ? <Download className="h-4 h-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}
