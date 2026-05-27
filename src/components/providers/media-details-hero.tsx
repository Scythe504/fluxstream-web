"use client"

import Image from "next/image"
import Link from "next/link"
import { CalendarDays, Clock, Film, Play, Star, Tv } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Episode, Media } from "@/hooks/use-provider"
import { formatLabel, formatRating } from "./provider-media-utils"

interface MediaDetailsHeroProps {
  details: Media
  provider: string
  firstEpisode?: Episode
  onStartWatching: (episode: Episode) => void
}

export function MediaDetailsHero({
  details,
  provider,
  firstEpisode,
  onStartWatching,
}: MediaDetailsHeroProps) {
  const primaryImage = details.banner || details.cover
  const metaItems = [
    { icon: Star, label: "Rating", value: formatRating(details.score) },
    { icon: Tv, label: "Type", value: formatLabel(details.type) },
    {
      icon: CalendarDays,
      label: "Season",
      value: `${formatLabel(details.season)} ${details.season_year || ""}`.trim() || "-",
      href: `/providers/${provider}?season=${details.season.toLowerCase()}&year=${details.season_year}`,
    },
    { icon: Clock, label: "Duration", value: details.duration ? `${details.duration} min` : "-" },
  ]

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="relative h-[165px] overflow-hidden bg-muted sm:h-[250px] lg:h-[310px]">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={details.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-background/45 to-background/5" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
      </div>

      <div className="relative px-4 pb-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:gap-7">
          <div className="relative z-10 mx-auto -mt-14 w-36 space-y-3 sm:-mt-24 sm:w-44 lg:mx-0 lg:-mt-24 lg:w-[180px]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-muted shadow-2xl ring-1 ring-background/60">
              {details.cover ? (
                <Image
                  src={details.cover}
                  alt={`${details.title} cover`}
                  fill
                  sizes="(min-width: 1024px) 180px, 176px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Film className="h-8 w-8" />
                </div>
              )}
            </div>

            {firstEpisode ? (
              <Button
                size="lg"
                className="h-11 w-full rounded-lg"
                onClick={() => onStartWatching(firstEpisode)}
              >
                <Play className="h-4 w-4 fill-current" />
                Start Watching
              </Button>
            ) : null}
          </div>

          <div className="min-w-0 space-y-4 text-center lg:-mt-20 lg:text-left">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {formatLabel(details.status)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                  <Star className="h-3 w-3 fill-current" />
                  {formatRating(details.score)}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {details.title}
              </h1>
              {details.original_title && details.original_title !== details.title ? (
                <p className="text-sm text-muted-foreground sm:text-base">
                  {details.original_title}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {metaItems.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.label} className="rounded-lg border border-border/70 bg-background/60 p-3 text-left">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                    {"href" in item && item.href ? (
                      <Link href={item.href} className="text-sm font-semibold text-foreground hover:text-primary">
                        {item.value}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {details.description ? (
              <div className="mx-auto max-w-4xl text-left lg:mx-0">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Synopsis</h2>
                <div
                  className="line-clamp-5 text-sm leading-6 text-muted-foreground sm:line-clamp-none sm:text-base [&_br]:hidden"
                  dangerouslySetInnerHTML={{ __html: details.description }}
                />
              </div>
            ) : null}

            {(details.genres || []).length > 0 ? (
              <div className="space-y-2 text-left">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Genres</h2>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {(details.genres || []).map((genre) => (
                    <Link
                      key={genre}
                      href={`/providers/${provider}?genre=${encodeURIComponent(genre)}`}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
