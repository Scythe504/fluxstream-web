"use client"

import Image from "next/image"
import { CalendarClock, Film, ListVideo, Play } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Airing, Episode } from "@/hooks/use-provider"
import { formatAirDate, formatTimeUntil } from "./provider-media-utils"

interface MediaEpisodeListProps {
  activeTab: string
  episodes: Episode[]
  specials: Episode[]
  loading: boolean
  nextAiring: Airing | null
  currentPage: number
  totalCount: number
  perPage: number
  onPageChange: (page: number) => void
  onTabChange: (value: string) => void
  onSelectEpisode: (episode: Episode) => void
}

const UpcomingEpisodeRow = ({ airing }: { airing: Airing }) => (
  <div className="grid w-full grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-left sm:grid-cols-[5rem_1fr_auto]">
    <div className="flex aspect-video items-center justify-center rounded-md bg-primary/10 text-primary">
      <CalendarClock className="h-5 w-5" />
    </div>
    <div className="min-w-0 space-y-1">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
        <span>Episode {airing.episode}</span>
        <span className="text-muted-foreground">Upcoming</span>
      </div>
      <h3 className="truncate text-sm font-medium text-foreground">
        Releasing in {formatTimeUntil(airing.airing_at)}
      </h3>
      <p className="hidden truncate text-xs text-muted-foreground sm:block">
        This episode is not available yet.
      </p>
    </div>
    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
      Soon
    </span>
  </div>
)

const EpisodeRow = ({
  episode,
  onSelect,
}: {
  episode: Episode
  onSelect: (episode: Episode) => void
}) => {
  const airDate = formatAirDate(episode.air_date)

  return (
    <button
      type="button"
      onClick={() => onSelect(episode)}
      className="group grid w-full grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3 text-left transition-colors hover:border-primary/30 hover:bg-accent/35 sm:grid-cols-[5rem_1fr_auto]"
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
        {episode.image ? (
          <Image
            src={episode.image}
            alt={episode.title || `Episode ${episode.number}`}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Film className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
          <span>Episode {episode.number}</span>
          {airDate ? <span className="hidden text-muted-foreground sm:inline">{airDate}</span> : null}
        </div>
        <h3 className="truncate text-sm font-medium text-foreground">
          {episode.title || `Episode ${episode.number}`}
        </h3>
        {episode.overview ? (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {episode.overview}
          </p>
        ) : null}
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Play className="h-3.5 w-3.5 fill-current" />
      </div>
    </button>
  )
}

export function MediaEpisodeList({
  activeTab,
  episodes,
  specials,
  loading,
  nextAiring,
  currentPage,
  totalCount,
  perPage,
  onPageChange,
  onTabChange,
  onSelectEpisode,
}: MediaEpisodeListProps) {
  const totalPages = Math.ceil(totalCount / perPage)

  const renderPagination = () => {
    if (activeTab !== "episodes" || totalPages <= 1) return null

    return (
      <div className="sticky top-16 z-20 flex items-center gap-1.5 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Ranges:
        </span>
        {Array.from({ length: totalPages }, (_, idx) => {
          const page = idx + 1
          const start = idx * perPage + 1
          const end = Math.min((idx + 1) * perPage, totalCount)
          const isActive = currentPage === page

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm scale-102"
                  : "bg-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              }`}
            >
              {start}-{end}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={onTabChange} className="gap-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <ListVideo className="h-4 w-4 text-primary" />
                Episodes
              </h2>
              <p className="text-xs text-muted-foreground">
                {activeTab === "episodes"
                  ? `${totalCount || episodes.length} released episodes available`
                  : `${specials.length} special episodes available`}
              </p>
            </div>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="episodes" className="flex-1 sm:flex-none">Episodes</TabsTrigger>
              <TabsTrigger value="specials" className="flex-1 sm:flex-none">Specials</TabsTrigger>
            </TabsList>
          </div>

          {(["episodes", "specials"] as const).map((tab) => {
            const list = tab === "specials" ? specials : episodes

            return (
              <TabsContent key={tab} value={tab} className="m-0">
                {tab === "episodes" && renderPagination()}
                {loading ? (
                  <ScrollArea className="h-[460px]">
                    <div className="space-y-2 p-4 animate-pulse">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="grid w-full grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3 text-left sm:grid-cols-[5rem_1fr_auto]">
                          <Skeleton className="aspect-video w-16 sm:w-20 bg-muted rounded-md shrink-0" />
                          <div className="min-w-0 space-y-2 flex-1">
                            <Skeleton className="h-3 w-16 bg-muted rounded" />
                            <Skeleton className="h-4 w-2/3 bg-muted rounded" />
                          </div>
                          <Skeleton className="h-8 w-8 rounded-full bg-muted shrink-0" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : list.length === 0 && !(tab === "episodes" && nextAiring) ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No released {tab} found for this title.
                  </p>
                ) : (
                  <ScrollArea className="h-[460px]">
                    <div className="space-y-2 p-4">
                      {list.map((episode) => (
                        <EpisodeRow
                          key={`${tab}-${episode.id}-${episode.number}`}
                          episode={episode}
                          onSelect={onSelectEpisode}
                        />
                      ))}
                      {tab === "episodes" && nextAiring ? (
                        <UpcomingEpisodeRow airing={nextAiring} />
                      ) : null}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
