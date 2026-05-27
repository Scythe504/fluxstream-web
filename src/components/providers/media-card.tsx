'use client'

import * as React from "react"
import Image from "next/image"
import { Star, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Media } from "@/hooks/use-provider"
import { formatRating } from "./provider-media-utils"

interface MediaCardProps {
  media: Media
  onClick: () => void
}

export function MediaCard({ media, onClick }: MediaCardProps) {
  return (
    <Card
      onClick={onClick}
      className="flex h-full flex-col gap-0 overflow-hidden border border-border bg-card py-0 shadow-sm cursor-pointer select-none rounded-xl transition-all hover:bg-accent/40"
    >
      {/* Top half: full cover image with absolutely no padding */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-muted">
        {media.cover ? (
          <Image
            src={media.cover}
            alt={media.title}
            fill
            sizes="(min-width: 1536px) 16vw, (min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-light">No Cover</span>
          </div>
        )}
        
        {media.score > 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/85 text-amber-500 flex items-center gap-0.5 border border-amber-500/20 backdrop-blur-xs">
            <Star className="w-2.5 h-2.5 fill-current animate-pulse" />
            {formatRating(media.score)}
          </span>
        )}
      </div>

      {/* Bottom half: title and year metadata */}
      <CardContent className="p-3 flex-1 flex flex-col justify-between gap-1.5 min-w-0">
        <div>
          <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-tight tracking-tight">
            {media.title}
          </h4>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/50 font-medium">
          <span>{media.season_year || "Unknown"}</span>
          <span className="text-primary flex items-center gap-0.5 font-medium">
            Browse <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
