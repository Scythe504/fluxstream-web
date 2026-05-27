import { useState, useCallback } from "react"
import { toast } from "sonner"

export interface Video {
  id: string
  magnet_link: string
  status: "processing" | "downloading" | "downloaded" | "failed"
  file_path: string | null
  deleted: boolean
}

export interface VideoMetadata {
  name: string
  path: string
  length: number
  extension: string
  is_video: boolean
}

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)
  const [loadingMetadata, setLoadingMetadata] = useState(false)

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/videos")
      if (!res.ok) throw new Error("Failed to fetch videos")
      const data = await res.json()
      setVideos(data || [])
    } catch (err) {
      console.error("Error fetching videos:", err)
      toast.error("Failed to load videos from library")
    } finally {
      setLoading(false)
    }
  }, [])

  const createVideo = useCallback(async (magnetLink: string): Promise<string> => {
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ magnet_link: magnetLink }),
    })
    if (!res.ok) {
      let errorMessage = "Failed to start streaming source"
      try {
        const contentType = res.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errData = await res.json()
          errorMessage = errData.error || errData.message || errorMessage
        } else {
          const text = await res.text()
          errorMessage = text || errorMessage
        }
      } catch {
        errorMessage = res.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }
    const data = await res.json()
    if (!data?.video_id) {
      throw new Error("No video_id returned from server")
    }
    return data.video_id
  }, [])

  const deleteVideo = useCallback(async (videoId: string): Promise<boolean> => {
    const toastId = toast.loading("Deleting torrent media...")
    try {
      const res = await fetch(`/api/torrents/${videoId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_resource: true }),
      })
      if (!res.ok) {
        let errorMessage = "Failed to delete media"
        try {
          const contentType = res.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json()
            errorMessage = errData.error || errData.message || errorMessage
          } else {
            const text = await res.text()
            errorMessage = text || errorMessage
          }
        } catch {
          errorMessage = res.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      setVideos((prev) => prev.filter((v) => v.id !== videoId))
      toast.success("Torrent deleted successfully", { id: toastId })
      return true
    } catch (err) {
      console.error("Error deleting video:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to delete torrent media"
      toast.error(errorMessage, { id: toastId })
      return false
    }
  }, [])

  const fetchMetadata = useCallback(async (videoId: string) => {
    try {
      setLoadingMetadata(true)
      const res = await fetch(`/api/videos/${videoId}/metadata`)
      if (!res.ok) throw new Error("Failed to fetch video metadata")
      const data = await res.json()
      setMetadata(data)
    } catch (err) {
      console.error("Error fetching video metadata:", err)
      setMetadata({
        name: "Video",
        path: "-",
        length: 0,
        extension: ".mkv",
        is_video: true,
      })
    } finally {
      setLoadingMetadata(false)
    }
  }, [])

  return {
    videos,
    loading,
    metadata,
    loadingMetadata,
    fetchVideos,
    createVideo,
    deleteVideo,
    fetchMetadata,
    setVideos,
  }
}
