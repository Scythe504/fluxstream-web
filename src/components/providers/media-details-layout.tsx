"use client"

import { Episode, Media } from "@/hooks/use-provider"
import { MediaDetailsHero } from "./media-details-hero"
import { MediaDetailsSidebar } from "./media-details-sidebar"
import { MediaEpisodeList } from "./media-episode-list"
import { MediaRecommendations } from "./media-recommendations"

interface MediaDetailsLayoutProps {
  details: Media
  provider: string
  activeTab: string
  episodes: Episode[]
  specials: Episode[]
  loadingEpisodes: boolean
  currentPage: number
  totalCount: number
  perPage: number
  onPageChange: (page: number) => void
  onTabChange: (value: string) => void
  onSelectEpisode: (episode: Episode) => void
}

export function MediaDetailsLayout({
  details,
  provider,
  activeTab,
  episodes,
  specials,
  loadingEpisodes,
  currentPage,
  totalCount,
  perPage,
  onPageChange,
  onTabChange,
  onSelectEpisode,
}: MediaDetailsLayoutProps) {
  return (
    <div className="space-y-6">
      <MediaDetailsHero
        details={details}
        provider={provider}
        firstEpisode={episodes[0]}
        onStartWatching={onSelectEpisode}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <MediaEpisodeList
          activeTab={activeTab}
          episodes={episodes}
          specials={specials}
          loading={loadingEpisodes}
          nextAiring={details.next_airing}
          currentPage={currentPage}
          totalCount={totalCount}
          perPage={perPage}
          onPageChange={onPageChange}
          onTabChange={onTabChange}
          onSelectEpisode={onSelectEpisode}
        />
        <MediaDetailsSidebar
          details={details}
          provider={provider}
          episodes={episodes}
        />
      </div>

      <MediaRecommendations provider={provider} mediaId={details.id} />
    </div>
  )
}
