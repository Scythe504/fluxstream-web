'use client'
import { useEffect } from "react"
import { VideoCard } from "../video/video-cards"
import { Skeleton } from "../ui/skeleton"
import { NoVideos } from "./no-videos"
import { useVideos } from "@/hooks/use-videos"

export const Library = () => {
  const { videos, loading, fetchVideos, setVideos } = useVideos()

  const handleDelete = (deletedId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== deletedId))
  }

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

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
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}
