"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Media } from "@/hooks/use-provider"
import { MediaCard } from "./media-card"

interface PaginatedMediaViewerProps {
  title: string
  description?: string
  media: Media[]
  loading: boolean
  page: number
  hasNextPage: boolean
  onPageChange: (page: number) => void
  onSelectMedia: (media: Media) => void
  emptyMessage?: string
  stickyTop?: string
}

export function PaginatedMediaViewer({
  title,
  description,
  media,
  loading,
  page,
  hasNextPage,
  onPageChange,
  onSelectMedia,
  emptyMessage = "No items found.",
  stickyTop,
}: PaginatedMediaViewerProps) {
  return (
    <section className="space-y-4">
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        stickyTop 
          ? `sticky ${stickyTop} z-10 bg-background/80 backdrop-blur-md py-3.5 border-b border-border -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8` 
          : ""
      }`}>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="min-w-10 text-center text-xs font-medium text-muted-foreground">{page}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || !hasNextPage}
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-[2/3] w-full bg-muted animate-pulse" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : media.length === 0 ? (
        <p className="py-12 text-center text-sm font-light text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onClick={() => onSelectMedia(item)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
