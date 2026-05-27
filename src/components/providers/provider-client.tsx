"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Media, useProviderPaginatedMedia, useProviderTrending } from "@/hooks/use-provider"
import { PaginatedMediaViewer } from "./paginated-media-viewer"
import { ProviderCarousel } from "./provider-carousel"
import { AiringSchedule } from "./airing-schedule"
import { formatLabel } from "./provider-media-utils"

interface ProviderClientProps {
  provider: string
}

interface ProviderConfig {
  type: "anime" | "movie-series" | "general";
  genres: string[];
  hasSeason: boolean;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  aniflux: {
    type: "anime",
    hasSeason: true,
    genres: [
      "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", 
      "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", 
      "Psychological", "Romance", "Sci-Fi", "Slice of Life", 
      "Sports", "Supernatural", "Thriller"
    ]
  },
  default: {
    type: "movie-series",
    hasSeason: false,
    genres: [
      "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", 
      "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery", 
      "Romance", "Sci-Fi", "Thriller", "War", "Western"
    ]
  }
}

const currentYearVal = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: currentYearVal + 1 - 1990 }, (_, i) => {
  const y = String(currentYearVal + 1 - i)
  return { value: y, label: y }
})

function PremiumSelect({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { value: string; label: string }[]; 
  placeholder: string 
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card/25 border border-border/40 backdrop-blur-sm rounded-lg pl-3 pr-8 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer transition-all hover:bg-card/40 appearance-none font-semibold min-w-[105px]"
      >
        <option value="" className="bg-zinc-950 text-zinc-400">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-zinc-950 text-foreground">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  )
}

function GenreSelectDropdown({
  selected,
  onToggle,
  options
}: {
  selected: string[];
  onToggle: (val: string) => void;
  options: string[];
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1 bg-card/25 border border-border/40 backdrop-blur-sm rounded-lg pl-3 pr-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer transition-all hover:bg-card/40 font-semibold min-w-[115px] select-none"
      >
        <span>
          {selected.length === 0 
            ? "All Genres" 
            : selected.length === 1 
              ? selected[0] 
              : `Genres (${selected.length})`}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-9 left-0 w-48 bg-zinc-950/95 border border-zinc-800 text-zinc-200 rounded-lg shadow-2xl backdrop-blur-md z-50 p-2 select-none animate-in fade-in slide-in-from-top-1 duration-150">
          <ScrollArea className="h-44 pr-1">
            <div className="flex flex-col gap-0.5 p-0.5">
              {options.map((opt) => {
                const isChecked = selected.includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onToggle(opt)}
                    className="w-full flex items-center gap-2 rounded px-2 py-1 text-xs text-left text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                      isChecked 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-zinc-700 bg-zinc-900"
                    }`}>
                      {isChecked && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

const hasAired = (media: Media) => {
  if (media.status === "NOT_YET_AIRED") return false

  const year = media.season_year
  if (!year) return true

  const currentYear = new Date().getFullYear()
  if (year < currentYear) return true
  if (year > currentYear) return false

  const currentMonth = new Date().getMonth() + 1
  const season = media.season

  if (season === "WINTER") return true
  if (season === "SPRING") return true
  if (season === "SUMMER") return currentMonth >= 7
  if (season === "FALL") return currentMonth >= 10

  return true
}


export const ProviderClient = ({ provider }: ProviderClientProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const season = searchParams.get("season")
  const year = searchParams.get("year")
  const genre = searchParams.get("genre")
  const perPage = 20
  const [currentPage, setCurrentPage] = React.useState(1)
  const [activeTab, setActiveTab] = React.useState<"trending" | "airing">("airing")

  const isAniflux = React.useMemo(() => provider.toLowerCase() === "aniflux", [provider])
  const isHome = !query && !genre && !season && !year



  // Reset page when any filter parameters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [query, season, year, genre])

  // Reset tab when provider changes
  React.useEffect(() => {
    setActiveTab("airing")
  }, [provider])

  const mode = query 
    ? "search" 
    : genre 
      ? "genre" 
      : (season || year) 
        ? "seasonal" 
        : (isAniflux ? activeTab : "trending")

  const endpoint = mode === "search" 
    ? "/search" 
    : mode === "genre" 
      ? "/genre" 
      : mode === "seasonal" 
        ? "/seasonal" 
        : mode === "trending" 
          ? "/trending" 
          : "/airing"

  const { trending, loading: loadingTrending } = useProviderTrending(provider)
  const { media, loading, hasNextPage } = useProviderPaginatedMedia(provider, endpoint, {
    page: currentPage,
    perPage,
    query,
    season,
    year,
    genre,
  })

  const airedTrending = React.useMemo(() => trending.filter(hasAired), [trending])
  const displayMedia = React.useMemo(() => {
    return media.filter(hasAired)
  }, [media])

  const config = React.useMemo(() => {
    const key = provider.toLowerCase()
    return PROVIDER_CONFIGS[key] || PROVIDER_CONFIGS.default
  }, [provider])

  const selectedGenres = React.useMemo(() => {
    return genre ? genre.split(",") : []
  }, [genre])

  const handleSelectYear = (y: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("genre")
    params.delete("q")
    if (y) {
      params.set("year", y)
    } else {
      params.delete("year")
    }
    router.push(`/providers/${provider}?${params.toString()}`)
  }

  const handleSelectSeason = (s: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("genre")
    params.delete("q")
    if (s) {
      params.set("season", s)
    } else {
      params.delete("season")
    }
    router.push(`/providers/${provider}?${params.toString()}`)
  }

  const handleToggleGenre = (g: string) => {
    let nextGenres = [...selectedGenres]
    if (nextGenres.includes(g)) {
      nextGenres = nextGenres.filter(item => item !== g)
    } else {
      nextGenres.push(g)
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("year")
    params.delete("season")
    params.delete("q")

    if (nextGenres.length > 0) {
      params.set("genre", nextGenres.join(","))
    } else {
      params.delete("genre")
    }

    router.push(`/providers/${provider}?${params.toString()}`)
  }

  const handleSelectMedia = (item: Media) => {
    router.push(`/providers/${provider}/${item.id}`)
  }

  const clearFilters = () => {
    router.push(`/providers/${provider}`)
  }

  const title = mode === "search"
    ? `Search Results for “${query}”`
    : mode === "genre"
      ? `${selectedGenres.join(" & ")} Anime`
      : mode === "seasonal"
        ? `${season ? formatLabel(season) : "Seasonal"} ${year || ""}`.trim()
        : mode === "trending"
          ? "Trending Titles"
          : "New Releases"

  const showSchedule = isHome && isAniflux

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Carousel always shows at the top of the homepage */}
        {isHome ? (
          <ProviderCarousel
            provider={provider}
            trending={airedTrending}
            loading={loadingTrending}
          />
        ) : null}

        {/* Dynamic Glassmorphic Filter Bar */}
        <div className="relative z-20 bg-card/10 p-4 rounded-xl border border-border/40 backdrop-blur-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 select-none">
          <div className="flex flex-wrap items-center gap-4">
            {/* New Releases & Trending tabs integrated directly inside the filter bar */}
            {isHome && isAniflux && (
              <Tabs 
                value={activeTab} 
                onValueChange={(val) => {
                  setActiveTab(val as "trending" | "airing")
                  setCurrentPage(1)
                }}
                className="shrink-0"
              >
                <TabsList className="bg-muted/40 border border-border/40 p-0.5 h-8.5">
                  <TabsTrigger value="airing" className="h-7.5 px-3.5 text-xs font-semibold">
                    New Releases
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="h-7.5 px-3.5 text-xs font-semibold">
                    Trending
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Separator if both tabs and filters are shown */}
            {isHome && isAniflux && <div className="hidden sm:block h-6 w-px bg-border/40" />}

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1 shrink-0">Filter Catalog</span>
              
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Year Selector */}
                <PremiumSelect
                  value={year || ""}
                  onChange={handleSelectYear}
                  options={YEAR_OPTIONS}
                  placeholder="All Years"
                />

                {/* Season Selector (Configurable - Anime Only) */}
                {config.hasSeason && (
                  <PremiumSelect
                    value={season || ""}
                    onChange={handleSelectSeason}
                    options={[
                      { value: "WINTER", label: "Winter" },
                      { value: "SPRING", label: "Spring" },
                      { value: "SUMMER", label: "Summer" },
                      { value: "FALL", label: "Fall" },
                    ]}
                    placeholder="All Seasons"
                  />
                )}

                {/* Multiple Genre Selector */}
                <GenreSelectDropdown
                  selected={selectedGenres}
                  onToggle={handleToggleGenre}
                  options={config.genres}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end xl:self-auto shrink-0">
            {/* View Schedule Button (integrated directly here) */}
            {isHome && isAniflux && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8.5 text-xs gap-1.5 border-border/60 hover:bg-accent/40 rounded-lg"
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById("schedule")
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" })
                  }
                }}
              >
                View Schedule
              </Button>
            )}

            {/* Clear Filters (Visible only if active filters are present) */}
            {!isHome && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs gap-1.5 border-border/60 hover:bg-accent/40 rounded-lg" 
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-10">
          <PaginatedMediaViewer
            title={title}
            description={mode === "trending" ? undefined : "Use the controls to browse more results."}
            media={displayMedia}
            loading={loading}
            page={currentPage}
            hasNextPage={hasNextPage}
            onPageChange={setCurrentPage}
            onSelectMedia={handleSelectMedia}
            stickyTop="top-16"
          />

          {showSchedule ? (
            <div id="schedule" className="bg-card/10 p-6 rounded-xl border border-border/40 backdrop-blur-sm scroll-mt-20">
              <AiringSchedule provider={provider} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
