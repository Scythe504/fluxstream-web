'use client'
import { VideoPage } from "@/components/video/video-page"
import { useParams } from "next/navigation"

export default function Home() {
  const params = useParams()
  const videoId = params.videoId as string

  return (
    <VideoPage videoId={videoId} />
  )
}
