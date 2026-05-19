"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Button } from "../ui/button"

interface VideoPlayerProps {
  videoId: string;
  videoUrl: string;
  metadata?: VideoMetadata;
}

export interface VideoMetadata {
  name: string;
  path: string;
  length: number;
  extension: string;
  is_video: boolean;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(videoUrl, { method: "HEAD" })
        if (!response.ok)
          throw new Error(`Failed to load video: ${response.status} ${response.statusText}`)
        setIsLoading(false)
      } catch (err) {
        setError(`Error loading video: ${err instanceof Error ? err.message : "Unknown error"}`)
        setIsLoading(false)
      }
    }
    fetchVideo()
  }, [videoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isHovering || !isPlaying) {
      setShowControls(true)
    } else {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isHovering && isPlaying) setShowControls(false)
      }, 2000)
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [isHovering, isPlaying])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) video.pause()
    else video.play()
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return
    const newVolume = value[0]
    setVolume(newVolume)
    video.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    if (isMuted) {
      video.volume = volume || 1
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = useCallback(() => {
    const container = videoContainerRef.current
    if (!container) return
    if (!document.fullscreenElement) container.requestFullscreen().catch(console.error)
    else document.exitFullscreen()
  }, [])

  const skipForward = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(video.currentTime + 10, video.duration)
  }

  const skipBackward = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(video.currentTime - 10, 0)
  }

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  useEffect(() => {
    const container = videoContainerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return

      switch (e.key) {
        case " ":
          e.preventDefault()
          togglePlay()
          break
        case "ArrowRight":
          video.currentTime = Math.min(video.currentTime + 5, video.duration)
          setCurrentTime(video.currentTime)
          break
        case "ArrowLeft":
          video.currentTime = Math.max(video.currentTime - 5, 0)
          setCurrentTime(video.currentTime)
          break
        case "ArrowUp":
          e.preventDefault()
          const upVol = Math.min(volume + 0.05, 1)
          setVolume(upVol)
          video.volume = upVol
          setIsMuted(upVol === 0)
          break
        case "ArrowDown":
          e.preventDefault()
          const downVol = Math.max(volume - 0.05, 0)
          setVolume(downVol)
          video.volume = downVol
          setIsMuted(downVol === 0)
          break
        case "f":
        case "F":
          toggleFullscreen()
          break
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    return () => container.removeEventListener("keydown", handleKeyDown)
  }, [togglePlay, volume, toggleFullscreen])

  return (
    <div className="w-full space-y-4">
      <div
        ref={videoContainerRef}
        tabIndex={0}
        className="relative w-full focus:outline-0 overflow-hidden bg-zinc-950 flex items-center justify-center rounded-lg"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => videoContainerRef.current?.focus()}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 rounded-lg backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <span className="mt-4 text-muted-foreground font-medium">Loading video...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10 p-6 rounded-lg backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-destructive text-2xl font-bold">!</span>
            </div>
            <h3 className="text-destructive font-semibold text-lg mb-2">Error Loading Video</h3>
            <p className="text-muted-foreground text-center max-w-md">{error}</p>
          </div>
        )}

        <video
          ref={videoRef}
          className={cn(
            "w-full cursor-pointer aspect-video rounded-lg",
            isLoading || error ? "opacity-0" : "opacity-100"
          )}
          onClick={togglePlay}
          onLoadedData={() => setDuration(videoRef.current?.duration || 0)}
          onError={() => setError("Failed to load video.")}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={videoUrl} />
          Your browser does not support the video tag.
        </video>

        {/* Controls overlay */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 rounded-lg",
            showControls ? "opacity-100" : "opacity-0",
            (isLoading || error) && "hidden"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 flex w-full">
            <div className="flex-1 h-full" onDoubleClick={skipBackward} />
            {!isPlaying && (
              <div className="flex items-center justify-center">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full md:h-18 md:w-18 h-12 w-12 z-20 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={togglePlay}
                >
                  <Play className="md:size-8 size-5 fill-accent-foreground stroke-accent-foreground" />
                </Button>
              </div>
            )}
            <div className="flex-1 h-full" onDoubleClick={skipForward} />
          </div>

          <div className="sm:p-4 p-1 space-y-2 absolute bottom-0 right-0 left-0">
            <div className="flex items-center gap-2 pl-3">
              <span className="text-xs text-zinc-300 font-medium min-w-6 select-none">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 font-medium min-w-10 select-none">
                {duration > 0 ? formatTime(duration) : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={togglePlay}
                >
                  {isPlaying
                    ? <Pause className="fill-white stroke-white" />
                    : <Play className="fill-white stroke-white" />}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={skipBackward}
                >
                  <SkipBack className="fill-white stroke-white" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={skipForward}
                >
                  <SkipForward className="fill-white stroke-white" />
                </Button>

                <div className="flex items-center gap-1 group relative">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                    onClick={toggleMute}
                  >
                    {isMuted
                      ? <VolumeX className="fill-white stroke-white" />
                      : <Volume2 className="fill-white stroke-white" />}
                  </Button>
                  <div className="w-0 overflow-hidden transition-all duration-200 group-hover:overflow-visible">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="w-20 flex fill-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="fill-white stroke-white"/> : <Maximize className="fill-white stroke-white" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
