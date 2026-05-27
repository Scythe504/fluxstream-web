"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Episode, Media } from "@/hooks/use-provider"
import { formatLabel, formatRating } from "./provider-media-utils"

interface MediaDetailsSidebarProps {
  details: Media
  provider: string
  episodes: Episode[]
}

export function MediaDetailsSidebar({
  details,
  provider,
  episodes,
}: MediaDetailsSidebarProps) {
  const detailItems = [
    { label: "Status", value: formatLabel(details.status) },
    { label: "Rating", value: formatRating(details.score) },
    { label: "Episodes", value: details.total_episodes ?? (episodes.length || "-") },
    { label: "Original Title", value: details.original_title || "-" },
    { label: "Provider", value: formatLabel(provider) },
  ]

  return (
    <aside className="space-y-6">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-foreground">Details</h2>
          <div className="space-y-3">
            {detailItems.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                <span className="max-w-[60%] text-right text-xs font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}
