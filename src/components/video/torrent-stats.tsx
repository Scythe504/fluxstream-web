'use client'

import { useEffect, useState } from "react"
import { formatFileSize } from "@/lib/utils"
import { Download, Upload, Users, Activity, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`${backendURL}/torrents/${videoId}/stats/stream`)

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
  }, [backendURL, videoId])

  // Initial loading state
  if (!stats) {
    return (
      <Card className="w-full bg-card border-border backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse text-primary" />
            Torrent Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  const progressPercent = Math.round(stats.progress * 100)

  return (
    <Card className="w-full bg-card border-border backdrop-blur-sm relative overflow-hidden">
      {!isConnected && (
        <div className="absolute top-2 right-2">
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="Reconnecting..." />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Torrent Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground font-medium">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground/60">
            <span>{formatFileSize(stats.bytes_completed)}</span>
            <span>{formatFileSize(stats.total_bytes)}</span>
          </div>
        </div>

        {/* Speed Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Download className="h-3 w-3 text-green-500" />
              <span>Down</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {formatFileSize(stats.download_speed)}/s
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Upload className="h-3 w-3 text-blue-500" />
              <span>Up</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {formatFileSize(stats.upload_speed)}/s
            </p>
          </div>
        </div>

        {/* Peers Section */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Active Peers</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {stats.active_peers} <span className="text-muted-foreground text-xs font-normal">/ {stats.total_peers}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
