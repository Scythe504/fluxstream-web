'use client'

import { useEffect, useState } from "react"
import { formatFileSize } from "@/lib/utils"
import { Download, Upload, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface TorrentStats {
  bytes_completed: number
  bytes_missing: number
  total_bytes: number
  progress: number
  active_peers: number
  total_peers: number
  download_speed: number
  upload_speed: number
}

export const TorrentStats = ({ videoId }: { videoId: string }) => {
  const [stats, setStats] = useState<TorrentStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`/api/torrents/${videoId}/stats/stream`)

      eventSource.onopen = () => {
        setIsConnected(true);
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.error) {
            // Silently handle backend errors (torrent might be starting)
            return
          }
          setStats(data)
        } catch (err) {
          console.error("Failed to parse torrent stats:", err)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close()
        
        // Attempt to reconnect silently after 3 seconds
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    }
  }, [videoId])

  if (!stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16 bg-muted" />
            <Skeleton className="h-3 w-8 bg-muted" />
          </div>
          <Skeleton className="h-1.5 w-full bg-muted rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-8 w-full bg-muted rounded" />
          <Skeleton className="h-8 w-full bg-muted rounded" />
          <Skeleton className="h-8 w-full bg-muted rounded" />
        </div>
      </div>
    )
  }

  const progressPercent = Math.round(stats.progress * 100)

  return (
    <div className="space-y-5">
      {/* Progress Section */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Buffered to Disk</span>
          {isConnected ? (
            <span className="text-foreground font-semibold">{progressPercent}%</span>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
              <span className="h-1 w-1 rounded-full bg-amber-500" />
              Reconnecting
            </div>
          )}
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground/60 font-mono">
          <span>{formatFileSize(stats.bytes_completed)}</span>
          <span>{formatFileSize(stats.total_bytes)}</span>
        </div>
      </div>

      {/* Speed & Peers Section */}
      <div className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-border/50">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            <Download className="h-3 w-3 text-green-500" />
            <span>Down</span>
          </div>
          <p className="text-xs font-bold text-foreground">
            {formatFileSize(stats.download_speed)}/s
          </p>
        </div>
        
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            <Upload className="h-3 w-3 text-blue-500" />
            <span>Up</span>
          </div>
          <p className="text-xs font-bold text-foreground">
            {formatFileSize(stats.upload_speed)}/s
          </p>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            <span>Peers</span>
          </div>
          <p className="text-xs font-bold text-foreground">
            {stats.active_peers} <span className="text-muted-foreground/80 font-normal text-[10px]">/ {stats.total_peers}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
