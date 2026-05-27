'use client'
import { useCallback, useEffect, useState } from "react"
import VideoPlayer from "./video-player"
import { useVideos } from "@/hooks/use-videos"
import { TorrentStats } from "./torrent-stats"
import { toast } from "sonner"
import { formatFileSize } from "@/lib/utils"
import { Download, ChevronRight, ChevronLeft, Info, ArrowLeft } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

export const VideoPage = ({ videoId }: {
  videoId: string
}) => {
  const { metadata, fetchMetadata } = useVideos()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    fetchMetadata(videoId)
  }, [videoId, fetchMetadata])


  const handleDownload = useCallback(() => {
    toast("Coming Soon!", {
      description: "The download feature will come soon, for now just stream torrents as you go!"
    })
  }, [])

  return (
    <>
      {videoId && metadata && (
        <div className="space-y-4">
          {/* Breadcrumbs/Back button */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/library" className="hover:text-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 relative">
            {/* Main Content: Video and Title */}
            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-2 leading-tight">
                  {metadata.name}
                </h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="shrink-0 h-9 rounded-xl border-border bg-card"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {metadata.length !== 0 ? formatFileSize(metadata.length) : "-"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:flex hidden h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {isSidebarOpen ? <ChevronRight /> : <ChevronLeft />}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border bg-black aspect-video ring-1 ring-border/50 relative group">
                <VideoPlayer
                  videoId={videoId}
                  videoUrl={`/api/videos/${videoId}/stream`}
                  metadata={metadata}
                />
              </div>

              {/* Mobile Stats Toggle/Section */}
              <div className="lg:hidden block space-y-4">
                <TorrentStats videoId={videoId} />

                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" />
                    Media Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Format</span>
                      <p className="text-sm font-medium text-foreground uppercase">{metadata.extension.replace('.', '')}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Size</span>
                      <p className="text-sm font-medium text-foreground">{formatFileSize(metadata.length)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Stats */}
            <div className={cn(
              "lg:w-80 shrink-0 space-y-4 transition-all duration-300 lg:block hidden",
              !isSidebarOpen && "lg:w-0 lg:opacity-0 lg:pointer-events-none lg:overflow-hidden"
            )}>
              <TorrentStats videoId={videoId} />

              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" />
                  Media Information
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">Extension</span>
                    <span className="text-sm font-bold text-foreground uppercase bg-muted px-2 py-0.5 rounded-md">{metadata.extension.replace('.', '')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">Total Size</span>
                    <span className="text-sm font-bold text-foreground">{formatFileSize(metadata.length)}</span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                      File is being streamed and cached locally while you watch.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
