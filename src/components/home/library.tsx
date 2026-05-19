'use client'
import {
  useEffect,
  useState
} from "react"
import { VideoCard } from "../video/video-cards"
import { Skeleton } from "../ui/skeleton"
import { NoVideos } from "./no-videos"

interface Video {
  id: string
  magnet_link: string
  status: "processing" | "downloading" | "downloaded" | "failed"
  file_path: string | null
  deleted: boolean
}

export const Library = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(
          `${backendURL}/videos`,
          {
            method: "GET",
          }
        )

        if (!res.ok) throw new Error("Failed to fetch videos")

        const data = await res.json()
        setVideos(data)
      } catch (err) {
        console.error("Error fetching videos:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [backendURL])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <NoVideos />
      </div>
    )
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((v) => (
          <VideoCard
            key={v.id}
            processing={v.status !== "downloaded"}
            videoId={v.id}
            title={v.file_path?.split('/').pop() || v.id}
            duration={0}
            view_progress={0}
          />
        ))}
      </div>
    </div>
  )
}
