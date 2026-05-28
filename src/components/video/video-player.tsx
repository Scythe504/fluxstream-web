"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Loader2, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Subtitles, FastForward, Rewind
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Button } from "../ui/button"
import { ParsedCue, parseVttText, parseVttToHtml } from "@/lib/vtt-parser"


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
  const [subSize, setSubSize] = useState<"sm" | "md" | "lg" | "xl">("md")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Load subtitle settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSize = localStorage.getItem("fluxstream_sub_size") as "sm" | "md" | "lg" | "xl"
      if (savedSize) setSubSize(savedSize)
    }
  }, [])

  const handleSubSizeChange = (val: string) => {
    const size = val as "sm" | "md" | "lg" | "xl"
    setSubSize(size)
    localStorage.setItem("fluxstream_sub_size", size)
  }
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [subtitlesVersion, setSubtitlesVersion] = useState(0)
  const [parsedCues, setParsedCues] = useState<ParsedCue[]>([])
  const [isBuffering, setIsBuffering] = useState(false)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [skipFeedback, setSkipFeedback] = useState<{ show: boolean; text: string; direction: "forward" | "backward" | null }>({
    show: false,
    text: "",
    direction: null,
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [retryCount, setRetryCount] = useState(0)
  const pendingSeekTimeRef = useRef(0)
  const isRecoveringRef = useRef(false)
  const wasPlayingRef = useRef(true)
  const lastTimeRef = useRef(0)
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track current time in a ref to survive closures
  useEffect(() => {
    lastTimeRef.current = currentTime
  }, [currentTime])

  // Cleanup recovery timeout on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [])

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

  // Fetch subtitles in JS whenever the version, URL, or enabled state changes
  useEffect(() => {
    if (!subtitlesEnabled) {
      setParsedCues([])
      return
    }

    const fetchSubs = async () => {
      try {
        const url = `${videoUrl.replace("/stream", "/subs")}?v=${subtitlesVersion}`
        const response = await fetch(url)
        if (!response.ok) throw new Error("Failed to load subtitles")
        const text = await response.text()
        const cues = parseVttText(text)
        setParsedCues(cues)
      } catch (err) {
        console.error("Error loading subtitles:", err)
      }
    }

    fetchSubs()
  }, [videoUrl, subtitlesEnabled, subtitlesVersion])

  // Periodically refresh subtitle track as the torrent downloads more data
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setSubtitlesVersion(v => v + 1)
    }, 15000) // every 15 seconds

    return () => clearInterval(interval)
  }, [isPlaying])

  const handleVideoError = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const err = video.error
    console.error("Video player error code:", err ? err.code : "unknown", "message:", err ? err.message : "")

    // Don't retry if aborted by the user
    if (err && err.code === 1) {
      return
    }

    if (retryCount < 5) {
      setIsBuffering(true)
      const savedTime = lastTimeRef.current
      console.log(`Video stream connection lost. Attempting recovery in 2s (retry ${retryCount + 1}/5) at position ${savedTime}s...`)

      pendingSeekTimeRef.current = savedTime
      isRecoveringRef.current = true
      wasPlayingRef.current = isPlaying
      setRetryCount(prev => prev + 1)

      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }

      recoveryTimeoutRef.current = setTimeout(() => {
        const v = videoRef.current
        if (!v) return
        v.load()
      }, 2000)
    } else {
      setError(`Stream connection lost. Please check your network or refresh the page. (Error code: ${err ? err.code : "unknown"})`)
      setIsBuffering(false)
    }
  }, [retryCount, isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleWaiting = () => setIsBuffering(true)
    const handlePlaying = () => {
      setIsBuffering(false)
      setSubtitlesVersion(v => v + 1)
    }
    const handleSeeking = () => setIsBuffering(true)
    const handleSeeked = () => {
      setIsBuffering(false)
      setSubtitlesVersion(v => v + 1)
    }
    const handleProgress = () => {
      const buffered = video.buffered
      if (buffered.length > 0) {
        let maxBuffered = 0
        for (let i = 0; i < buffered.length; i++) {
          if (buffered.start(i) <= video.currentTime && buffered.end(i) >= video.currentTime) {
            maxBuffered = buffered.end(i)
            break
          }
        }
        if (maxBuffered === 0 && buffered.length > 0) {
          maxBuffered = buffered.end(buffered.length - 1)
        }
        setBufferedEnd(maxBuffered)
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)
    video.addEventListener("seeking", handleSeeking)
    video.addEventListener("seeked", handleSeeked)
    video.addEventListener("progress", handleProgress)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("seeking", handleSeeking)
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("progress", handleProgress)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    const container = videoContainerRef.current
    if (!container) return

    const handleMouseMove = () => {
      setShowControls(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (isPlaying && !isDropdownOpen) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false)
        }, 2000)
      }
    }

    const handleMouseLeave = () => {
      if (isPlaying && !isDropdownOpen) {
        setShowControls(false)
      }
    }

    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseleave", handleMouseLeave)

    if (isPlaying && !isDropdownOpen) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2000)
    } else {
      setShowControls(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }

    return () => {
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseleave", handleMouseLeave)
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [isPlaying, isDropdownOpen])

  const togglePlay = useCallback(() => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false)
      return
    }
    const video = videoRef.current
    if (!video) return
    if (isPlaying) video.pause()
    else video.play()
    setIsPlaying(!isPlaying)
  }, [isPlaying, isDropdownOpen])

  const toggleSubtitles = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const tracks = video.textTracks
    if (tracks && tracks.length > 0) {
      const track = tracks[0]
      const nextState = track.mode !== "hidden"
      track.mode = nextState ? "hidden" : "disabled"
      setSubtitlesEnabled(nextState)
      if (nextState) {
        setSubtitlesVersion(v => v + 1)
      }
    } else {
      const nextState = !subtitlesEnabled
      setSubtitlesEnabled(nextState)
      if (nextState) {
        setSubtitlesVersion(v => v + 1)
      }
    }
  }, [subtitlesEnabled])

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

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => {
          const orientation = window.screen && window.screen.orientation;
          if (orientation && typeof (orientation as unknown as { lock: (type: string) => Promise<void> }).lock === "function") {
            (orientation as unknown as { lock: (type: string) => Promise<void> }).lock("landscape").catch((err: unknown) => {
              console.warn("Screen orientation lock ignored/unsupported on this device:", err)
            })
          }
        })
        .catch(console.error)
    } else {
      document.exitFullscreen()
        .then(() => {
          const orientation = window.screen && window.screen.orientation;
          if (orientation && typeof (orientation as unknown as { unlock: () => void }).unlock === "function") {
            (orientation as unknown as { unlock: () => void }).unlock()
          }
        })
        .catch(console.error)
    }
  }, [])

  const triggerSkipFeedback = useCallback((text: string, direction: "forward" | "backward") => {
    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current)
    setSkipFeedback({ show: true, text, direction })
    skipTimeoutRef.current = setTimeout(() => {
      setSkipFeedback({ show: false, text: "", direction: null })
    }, 600)
  }, [])

  const skipForward = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(video.currentTime + 10, video.duration)
    triggerSkipFeedback("+10s", "forward")
  }, [triggerSkipFeedback])

  const skipBackward = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(video.currentTime - 10, 0)
    triggerSkipFeedback("-10s", "backward")
  }, [triggerSkipFeedback])

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
          triggerSkipFeedback("+5s", "forward")
          break
        case "ArrowLeft":
          video.currentTime = Math.max(video.currentTime - 5, 0)
          setCurrentTime(video.currentTime)
          triggerSkipFeedback("-5s", "backward")
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
  }, [togglePlay, volume, toggleFullscreen, triggerSkipFeedback])

  const activeCues = parsedCues.filter(
    cue => currentTime >= cue.startTime && currentTime <= cue.endTime
  )

  return (
    <div className="w-full h-full">
      <div
        ref={videoContainerRef}
        tabIndex={0}
        className={cn(
          "relative w-full h-full focus:outline-0 overflow-hidden bg-black flex items-center justify-center transition-all",
          isFullscreen ? "rounded-none" : "rounded-lg",
          !showControls && "cursor-none"
        )}
        onClick={() => videoContainerRef.current?.focus()}
      >
        {isLoading && (
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 backdrop-blur-sm transition-all",
            isFullscreen ? "rounded-none" : "rounded-lg"
          )}>
            <Loader2 className="h-12 w-12 animate-spin text-white" />
            <span className="mt-4 text-zinc-400 font-medium">Loading video...</span>
          </div>
        )}

        {isBuffering && isPlaying && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 pointer-events-none">
            <div className="rounded-full md:h-18 md:w-18 h-12 w-12 flex items-center justify-center bg-zinc-900/80 border border-white/10 z-20 shadow-2xl backdrop-blur-md">
              <Loader2 className="md:size-8 size-5 animate-spin text-white" />
            </div>
          </div>
        )}

        {error && (
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 p-6 backdrop-blur-sm transition-all",
            isFullscreen ? "rounded-none" : "rounded-lg"
          )}>
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-destructive/30">
              <span className="text-destructive text-2xl font-bold">!</span>
            </div>
            <h3 className="text-destructive font-semibold text-lg mb-2">Error Loading Video</h3>
            <p className="text-zinc-400 text-center max-w-md">{error}</p>
          </div>
        )}
        {/* Skip Feedback Overlay */}
        {skipFeedback.show && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="animate-in fade-in zoom-in-90 duration-200 bg-black/70 backdrop-blur-md rounded-full w-24 h-24 flex flex-col items-center justify-center gap-1 shadow-2xl border border-white/10">
              {skipFeedback.direction === "forward" ? (
                <FastForward className="h-6 w-6 text-white fill-white" />
              ) : (
                <Rewind className="h-6 w-6 text-white fill-white" />
              )}
              <span className="text-white text-sm font-bold tracking-wider">
                {skipFeedback.text}
              </span>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-contain transition-all",
            isFullscreen ? "rounded-none" : "rounded-lg",
            isLoading || error ? "opacity-0" : "opacity-100",
            showControls ? "cursor-pointer" : "cursor-none"
          )}
          crossOrigin="anonymous"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          onLoadedData={() => {
            const video = videoRef.current
            if (!video) return
            setDuration(video.duration || 0)

            if (isRecoveringRef.current) {
              isRecoveringRef.current = false
              video.currentTime = pendingSeekTimeRef.current

              if (wasPlayingRef.current) {
                video.play().then(() => {
                  setError(null)
                  setRetryCount(0)
                  setIsBuffering(false)
                }).catch(playErr => {
                  console.warn("Failed to autoplay after stream recovery:", playErr)
                  setIsBuffering(false)
                })
              } else {
                setError(null)
                setRetryCount(0)
                setIsBuffering(false)
              }
            } else {
              setRetryCount(0)
              setError(null)
            }
          }}
          onError={handleVideoError}
          onPlay={() => {
            setIsPlaying(true)
            setSubtitlesVersion(v => v + 1)
          }}
          onPause={() => {
            setIsPlaying(false)
            setSubtitlesVersion(v => v + 1)
          }}
        >
          <source src={videoUrl} />
          Your browser does not support the video tag.
        </video>

        {/* Custom Subtitles Overlay */}
        {subtitlesEnabled && activeCues.length > 0 && (
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-full max-w-[85%] flex flex-col items-center justify-end pointer-events-none z-10 gap-2 mb-2 select-none transition-all duration-200",
              showControls ? "bottom-[18%]" : "bottom-[8%]"
            )}
          >
            {[...activeCues]
              .sort((a, b) => b.startTime - a.startTime)
              .filter(cue => (cue.text || "").trim() !== "")
              .map((cue, idx) => {
                const text = cue.text || ""
                const startTime = cue.startTime || 0

                // Font family configuration inline styling (system sans-serif for optimal performance and legibility)
                const fontStyle = { fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }

                // Font size configuration
                const baseSize = {
                  sm: isFullscreen ? "min(2.0vw, 20px)" : "min(3.5vw, 14px)",
                  md: isFullscreen ? "min(2.8vw, 26px)" : "min(4.5vw, 18px)",
                  lg: isFullscreen ? "min(3.6vw, 32px)" : "min(5.5vw, 24px)",
                  xl: isFullscreen ? "min(4.4vw, 40px)" : "min(6.5vw, 30px)"
                }[subSize]

                return (
                  <div
                    key={`${startTime}-${idx}`}
                    className="subtitle-cue text-center font-bold text-white tracking-wide select-none leading-normal transition-all [text-shadow:-1.5px_-1.5px_0_#000,1.5px_-1.5px_0_#000,-1.5px_1.5px_0_#000,1.5px_1.5px_0_#000,0_1.5px_3px_rgba(0,0,0,0.8)]"
                    style={{
                      fontSize: baseSize,
                      ...fontStyle
                    }}
                    dangerouslySetInnerHTML={{ __html: parseVttToHtml(text) }}
                  />
                )
              })}
          </div>
        )}

        {/* Controls overlay */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-between bg-linear-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300",
            isFullscreen ? "rounded-none" : "rounded-lg",
            showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            (isLoading || error) && "hidden"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Interactive background area to capture clicks and double-clicks */}
          <div
            className="absolute inset-0 z-0 cursor-pointer"
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
          />

          {/* Center Play Button Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Button
                size="icon"
                className="rounded-full md:h-18 md:w-18 h-12 w-12 flex items-center justify-center bg-zinc-900/80 hover:bg-zinc-800/80 text-white border border-white/10 shadow-2xl backdrop-blur-md transition-all focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none pointer-events-auto animate-in fade-in zoom-in duration-200"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  toggleFullscreen()
                }}
              >
                <Play className="md:size-8 size-5 fill-white stroke-white ml-0.5" />
              </Button>
            </div>
          )}

          <div className="sm:p-4 p-2.5 space-y-2 absolute bottom-0 right-0 left-0 z-20">
            <div className="flex items-center gap-2 px-2 flex-1 relative group">
              <span className="text-xs text-zinc-300 font-medium min-w-6 select-none">{formatTime(currentTime)}</span>
              <div className="flex-1 relative flex items-center h-5">
                {/* Custom Buffer Track background */}
                <div className="absolute left-0 right-0 h-1.5 bg-zinc-700/60 rounded-full overflow-hidden pointer-events-none">
                  <div
                    className="h-full bg-zinc-400/40 transition-all duration-300"
                    style={{ width: `${duration > 0 ? (bufferedEnd / duration) * 100 : 0}%` }}
                  />
                </div>
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="relative z-10 flex-1 cursor-pointer h-full **:data-[slot=slider-track]:bg-transparent"
                />
              </div>
              <span className="text-xs text-zinc-300 font-medium min-w-10 select-none">
                {duration > 0 ? formatTime(duration) : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 sm:h-9 sm:w-9 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={togglePlay}
                >
                  {isPlaying
                    ? <Pause className="fill-white stroke-white" />
                    : <Play className="fill-white stroke-white" />}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 sm:h-9 sm:w-9 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={skipBackward}
                >
                  <SkipBack className="fill-white stroke-white" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 sm:h-9 sm:w-9 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={skipForward}
                >
                  <SkipForward className="fill-white stroke-white" />
                </Button>

                <div className="sm:flex hidden items-center gap-1 group relative">
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

              <div className="flex items-center gap-2 relative">
                {isDropdownOpen && (
                  <div
                    className="absolute bottom-12 right-0 w-56 bg-zinc-950/95 border border-zinc-800 text-zinc-200 rounded-xl shadow-2xl backdrop-blur-md z-30 p-3 select-none flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 py-0.5">
                      Subtitle Settings
                    </div>

                    <div className="h-px bg-zinc-800" />

                    {/* Subtitles Enabled Row */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSubtitles()
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Enable Subtitles</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                        subtitlesEnabled
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-zinc-800 text-zinc-400"
                      )}>
                        {subtitlesEnabled ? "ON" : "OFF"}
                      </span>
                    </button>

                    <div className="h-px bg-zinc-800" />

                    {/* Font Size options */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 px-2">
                        Font Size
                      </span>
                      <div className="grid grid-cols-4 gap-1 p-0.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                        {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSubSizeChange(sz)
                            }}
                            className={cn(
                              "rounded-md py-1 text-[10px] font-medium transition-all text-center cursor-pointer uppercase",
                              subSize === sz
                                ? "bg-zinc-700 text-white shadow-sm"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                            )}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-10 w-10 sm:h-9 sm:w-9 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none relative",
                    !subtitlesEnabled && "text-zinc-500 hover:text-zinc-400",
                    isDropdownOpen && "text-white bg-zinc-800/40"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsDropdownOpen(!isDropdownOpen)
                  }}
                  title="Subtitle Settings"
                >
                  <Subtitles className={cn(
                    "h-5 w-5 fill-transparent stroke-white",
                    !subtitlesEnabled && "opacity-40"
                  )} />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 sm:h-9 sm:w-9 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:ring-0 active:ring-offset-0 focus:outline-none"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="fill-white stroke-white" /> : <Maximize className="fill-white stroke-white" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}