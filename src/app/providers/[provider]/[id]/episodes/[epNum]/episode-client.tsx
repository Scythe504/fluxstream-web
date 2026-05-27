'use client'

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { 
  Play, ArrowLeft, Loader2, 
  Activity, Users
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { formatFileSize, cn } from "@/lib/utils"
import { filterReleasedEpisodes, formatAirDate } from "@/components/providers/provider-media-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  useProviderDetails, useProviderEpisodes, useProviderSources,
  Source
} from "@/hooks/use-provider"
import VideoPlayer from "@/components/video/video-player"
import { TorrentStats } from "@/components/video/torrent-stats"
import { useVideos } from "@/hooks/use-videos"

interface MarqueeTextProps {
  text: string;
  className?: string;
}

function MarqueeText({ text, className }: MarqueeTextProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const textRef = React.useRef<HTMLSpanElement>(null)
  const [scrollDistance, setScrollDistance] = React.useState(0)

  React.useEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const measure = () => {
      const containerWidth = container.clientWidth
      const textWidth = textEl.scrollWidth
      if (textWidth > containerWidth) {
        setScrollDistance(textWidth - containerWidth)
      } else {
        setScrollDistance(0)
      }
    }

    measure()
    
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(container)
    
    return () => resizeObserver.disconnect()
  }, [text])

  const style = scrollDistance > 0 
    ? { "--scroll-distance": `-${scrollDistance + 20}px` } as React.CSSProperties 
    : {}

  return (
    <div 
      ref={containerRef}
      className="marquee-container"
      style={style}
    >
      <span 
        ref={textRef}
        className={cn(
          "marquee-text",
          scrollDistance > 0 && "marquee-scrollable",
          className
        )}
      >
        {text}
      </span>
    </div>
  )
}

const getFileExtension = (title: string): string => {
  if (!title) return ".mkv"
  const match = title.match(/\.[a-zA-Z0-9]+$/)
  const ext = match ? match[0].toLowerCase() : ".mkv"
  const supported = [".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv"]
  return supported.includes(ext) ? ext : ".mkv"
}

const compareNatural = (a: string, b: string): number => {
  const splitChunks = (s: string): (string | number)[] => {
    const chunks: (string | number)[] = []
    let i = 0
    while (i < s.length) {
      const isDigit = s[i] >= '0' && s[i] <= '9'
      const start = i
      while (i < s.length && (s[i] >= '0' && s[i] <= '9') === isDigit) {
        i++
      }
      const chunk = s.slice(start, i)
      chunks.push(isDigit ? parseInt(chunk, 10) : chunk)
    }
    return chunks
  }

  const chunksA = splitChunks(a)
  const chunksB = splitChunks(b)

  for (let i = 0; i < chunksA.length && i < chunksB.length; i++) {
    const cA = chunksA[i]
    const cB = chunksB[i]

    if (cA === cB) continue

    if (typeof cA === "number" && typeof cB === "number") {
      return cA - cB
    }

    return String(cA).localeCompare(String(cB))
  }

  return chunksA.length - chunksB.length
}

interface EpisodeClientProps {
  provider: string
  mediaId: string
  epNum: string
}

export default function EpisodeClient({ provider, mediaId, epNum }: EpisodeClientProps) {
  const { createVideo } = useVideos()
  
  // Custom hooks
  const { details, fetchDetails } = useProviderDetails(provider)
  const { episodes, specials, fetchEpisodes, loading: loadingEpisodes } = useProviderEpisodes(provider)
  const { sources, fetchSources, loading: loadingSources } = useProviderSources(provider)

  // Stream state
  const [activeSource, setActiveSource] = React.useState<Source | null>(null)
  const [activeVideoId, setActiveVideoId] = React.useState<string | null>(null)
  const [isInitializingStream, setIsInitializingStream] = React.useState(false)

  // Fetch initial details and all episodes (only when mediaId changes)
  React.useEffect(() => {
    if (mediaId) {
      fetchDetails(mediaId)
      fetchEpisodes(mediaId, 1, 10000)
    }
  }, [mediaId, fetchDetails, fetchEpisodes])

  // Fetch sources when current episode changes
  React.useEffect(() => {
    if (mediaId && epNum) {
      fetchSources(mediaId, epNum)
    }
  }, [mediaId, epNum, fetchSources])

  // Select source, do not auto-initialize stream
  React.useEffect(() => {
    if (sources.length > 0 && !activeSource) {
      setActiveSource(sources[0])
    }
  }, [sources, activeSource])

  // Reset active source when epNum changes (to load first source of new episode)
  React.useEffect(() => {
    setActiveSource(null)
    setActiveVideoId(null)
  }, [epNum])

  // Initialize and select source
  const handleSelectSource = React.useCallback(async (source: Source) => {
    setActiveSource(source)
    setActiveVideoId(null) // Force unmounting of previous video player immediately
    setIsInitializingStream(true)
    const toastId = toast.loading(`Initializing stream for ${source.title}...`)
    
    try {
      const videoId = await createVideo(source.magnet_uri)
      if (!videoId) throw new Error("Invalid backend stream ID")

      toast.success("Stream initialized, starting playback", { id: toastId })
      setActiveVideoId(videoId)
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : "Failed to initialize source stream"
      toast.error(msg, { id: toastId })
    } finally {
      setIsInitializingStream(false)
    }
  }, [createVideo])

  // Find current episode details
  const currentEpisode = episodes.find(ep => ep.number === epNum) || specials.find(ep => ep.number === epNum)

  // Filter next episodes
  const releasedEpisodes = React.useMemo(() => filterReleasedEpisodes(episodes), [episodes])
  const nextEpisodes = releasedEpisodes.filter(ep => compareNatural(ep.number, epNum) > 0)
  const sidebarEpisodes = nextEpisodes.length > 0 ? nextEpisodes : releasedEpisodes.filter(ep => ep.number !== epNum)

  const { prevEpisode, nextEpisode, activeList } = React.useMemo(() => {
    const isSpecial = specials.some(ep => ep.number === epNum)
    const list = isSpecial ? specials : releasedEpisodes
    const currentIdx = list.findIndex(ep => ep.number === epNum)
    return {
      prevEpisode: currentIdx > 0 ? list[currentIdx - 1] : null,
      nextEpisode: currentIdx !== -1 && currentIdx < list.length - 1 ? list[currentIdx + 1] : null,
      activeList: list,
    }
  }, [releasedEpisodes, specials, epNum])

  return (
    <div className="space-y-6">
      {/* Navigation breadcrumb */}
      <Link 
        href={`/providers/${provider}/${mediaId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {details?.title || "Details"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Video column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-2">
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-medium">
              Episode {epNum}
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight leading-tight">
              {currentEpisode?.title || `Episode ${epNum}`}
            </h1>
            {currentEpisode?.overview && (
              <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed max-w-4xl">
                {currentEpisode.overview}
              </p>
            )}
          </div>

          {/* Player area */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border bg-black aspect-video ring-1 ring-border/50 relative group">
            {activeVideoId ? (
              <VideoPlayer
                key={activeVideoId} // Key forces full react remount on source switch
                videoId={activeVideoId}
                videoUrl={`/api/videos/${activeVideoId}/stream`}
                metadata={{
                  name: activeSource?.title || currentEpisode?.title || `Episode ${epNum}`,
                  path: "",
                  length: activeSource?.size || 0,
                  extension: getFileExtension(activeSource?.title || ""),
                  is_video: true,
                }}
              />
            ) : (
              <div className="relative w-full h-full bg-card flex flex-col items-center justify-center border border-border rounded-2xl gap-3">
                {details?.banner || details?.cover ? (
                  <Image
                    src={details.banner || details.cover}
                    alt={details.title}
                    fill
                    sizes="(min-width: 1024px) 75vw, 100vw"
                    className="pointer-events-none object-cover opacity-20"
                    priority
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <div className="relative z-10 text-center space-y-4 max-w-md p-6">
                  <h3 className="text-sm font-medium text-foreground">
                    Selected Stream: {activeSource?.title || (loadingSources ? "Loading sources..." : "No Source Selected")}
                  </h3>
                  <p className="text-xs text-muted-foreground font-light">
                    {loadingSources 
                      ? "Finding available torrent magnet options..." 
                      : "Click play below to initialize torrent connection and start streaming this episode."}
                  </p>
                  <Button
                    onClick={() => activeSource && handleSelectSource(activeSource)}
                    disabled={isInitializingStream || !activeSource || loadingSources}
                    className="rounded-full h-12 px-6 font-medium"
                  >
                    {isInitializingStream ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Play className="w-5 h-5 fill-current mr-2" />
                    )}
                    {isInitializingStream ? "Connecting to Peers..." : "Start Streaming"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Episode Navigation Paginator */}
          {activeList.length > 1 && (
            <div className="flex items-center justify-between p-3 rounded-xl border bg-card/50 shadow-sm gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!prevEpisode}
                asChild={!!prevEpisode}
                className="h-8 rounded-lg text-xs"
              >
                {prevEpisode ? (
                  <Link href={`/providers/${provider}/${mediaId}/episodes/${prevEpisode.number}`}>
                    ← Episode {prevEpisode.number}
                  </Link>
                ) : (
                  <span>← First Episode</span>
                )}
              </Button>

              <span className="text-xs font-semibold text-zinc-400 select-none">
                Episode {epNum} of {activeList.length}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={!nextEpisode}
                asChild={!!nextEpisode}
                className="h-8 rounded-lg text-xs"
              >
                {nextEpisode ? (
                  <Link href={`/providers/${provider}/${mediaId}/episodes/${nextEpisode.number}`}>
                    Episode {nextEpisode.number} →
                  </Link>
                ) : (
                  <span>End of Show →</span>
                )}
              </Button>
            </div>
          )}

          {/* Sources section */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-sm rounded-xl border">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Available Torrent Streams
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loadingSources ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border gap-4 bg-card/30">
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-3/4 bg-muted rounded" />
                        <div className="flex gap-3">
                          <Skeleton className="h-3 w-12 bg-muted rounded" />
                          <Skeleton className="h-3 w-16 bg-muted rounded" />
                          <Skeleton className="h-3 w-16 bg-muted rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-7 w-16 bg-muted rounded shrink-0" />
                    </div>
                  ))}
                </div>
              ) : sources.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted-foreground font-light">
                  No streams found for this episode.
                </p>
              ) : (
                <ScrollArea className="h-[300px] pr-2">
                  <div className="space-y-2 pr-1">
                  {sources.map((src, idx) => {
                    const isActive = activeSource?.info_hash === src.info_hash
                    const isPlaying = isActive && activeVideoId !== null
                    return (
                      <div
                        key={idx}
                        onClick={() => !isPlaying && !isInitializingStream && handleSelectSource(src)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all gap-4 ${
                          isActive 
                            ? "bg-accent border-accent-foreground/30 ring-1 ring-accent-foreground/10" 
                            : "bg-card/50 hover:bg-accent/40"
                        }`}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <MarqueeText 
                            text={src.title}
                            className={isActive ? "text-primary" : "text-foreground"}
                          />
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="font-semibold">{formatFileSize(src.size)}</span>
                            <span className="flex items-center gap-0.5 text-green-500 font-medium">
                              <Activity className="w-3 h-3" />
                              {src.seeders} seeds
                            </span>
                            <span className="flex items-center gap-0.5 text-zinc-500 font-medium">
                              <Users className="w-3 h-3" />
                              {src.leechers} peers
                            </span>
                          </div>
                        </div>
                        <Button
                          disabled={isPlaying || isInitializingStream}
                          variant={isActive ? "default" : "outline"}
                          size="sm"
                          className="shrink-0 text-[10px] h-7 px-3 font-medium"
                        >
                          {isActive && isInitializingStream ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : isPlaying ? (
                            "Playing"
                          ) : (
                            <>
                              <Play className="w-2.5 h-2.5 fill-current mr-1" />
                              Stream
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Next episodes panel */}
          <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-sm rounded-xl border">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-semibold">
                {nextEpisodes.length > 0 ? "Next Episodes" : "Other Episodes"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              {loadingEpisodes ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border bg-card/30 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-3 w-16 bg-muted rounded" />
                        <Skeleton className="h-2.5 w-12 bg-muted rounded" />
                      </div>
                      <Skeleton className="h-3.5 w-3/4 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : sidebarEpisodes.length === 0 ? (
                <p className="text-center py-4 text-xs text-muted-foreground font-light">No other episodes.</p>
              ) : (
                <ScrollArea className="h-[360px] pr-2">
                  <div className="space-y-2 pr-1">
                  {sidebarEpisodes.map((ep) => {
                    const isCurrent = ep.number === epNum
                    return (
                      <Link
                        key={ep.id}
                        href={`/providers/${provider}/${mediaId}/episodes/${ep.number}`}
                        className={`block p-2.5 rounded-lg border text-left transition-all ${
                          isCurrent 
                            ? "bg-accent/40 border-primary/20 pointer-events-none" 
                            : "bg-card/50 hover:bg-accent/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-primary">
                            Episode {ep.number}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{formatAirDate(ep.air_date)}</span>
                        </div>
                        <h4 className="text-xs font-medium text-foreground mt-1 truncate">
                          {ep.title || `Episode ${ep.number}`}
                        </h4>
                      </Link>
                    )
                  })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Torrent Stats panel */}
          {activeVideoId && (
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-sm rounded-xl border">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-semibold">Streaming Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <TorrentStats videoId={activeVideoId} />
              </CardContent>
            </Card>
          )}

          {/* Anime Details summary panel */}
          {details && (
            <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-sm rounded-xl border">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-semibold">Show Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted mb-1">
                  {details.banner || details.cover ? (
                    <Image
                      src={details.banner || details.cover}
                      alt={details.title}
                      fill
                      sizes="320px"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <h3 className="font-semibold text-foreground text-sm line-clamp-1">{details.title}</h3>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Status</span>
                  <p className="font-medium text-foreground">{details.status}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Season</span>
                  <p className="font-medium text-foreground uppercase">{details.season} {details.season_year}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
