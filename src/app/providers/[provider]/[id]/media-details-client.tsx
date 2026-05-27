'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { MediaDetailsLayout } from "@/components/providers/media-details-layout"
import { filterReleasedEpisodes } from "@/components/providers/provider-media-utils"
import { useProviderDetails, useProviderEpisodes, Episode } from "@/hooks/use-provider"
import { Skeleton } from "@/components/ui/skeleton"

interface MediaDetailsClientProps {
  provider: string
  id: string
}

export default function MediaDetailsClient({ provider, id }: MediaDetailsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("episodes")

  const [currentPage, setCurrentPage] = React.useState(1)

  const { details, fetchDetails, loading: loadingDetails } = useProviderDetails(provider)
  const { episodes, specials, totalCount, fetchEpisodes, loading: loadingEpisodes } = useProviderEpisodes(provider)

  React.useEffect(() => {
    if (id) {
      fetchDetails(id)
      fetchEpisodes(id, currentPage)
    }
  }, [id, currentPage, fetchDetails, fetchEpisodes])

  const releasedEpisodes = React.useMemo(() => filterReleasedEpisodes(episodes), [episodes])
  const releasedSpecials = React.useMemo(() => filterReleasedEpisodes(specials), [specials])

  const handleSelectEpisode = (episode: Episode) => {
    router.push(`/providers/${provider}/${id}/episodes/${episode.number}`)
  }

  if (loadingDetails) {
    return (
      <div className="space-y-6 pb-10 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Hero skeleton */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Banner area */}
          <div className="relative h-[165px] bg-muted sm:h-[250px] lg:h-[310px] w-full" />
          
          <div className="relative px-4 pb-5 sm:px-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:gap-7">
              {/* Cover image area */}
              <div className="relative z-10 mx-auto -mt-14 w-36 space-y-3 sm:-mt-24 sm:w-44 lg:mx-0 lg:-mt-24 lg:w-[180px]">
                <Skeleton className="relative aspect-[2/3] w-full rounded-lg border border-border bg-muted shadow-2xl" />
                <Skeleton className="h-11 w-full rounded-lg bg-muted" />
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0 space-y-4 text-center lg:-mt-20 lg:text-left pt-4 lg:pt-0">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                    <Skeleton className="h-5 w-20 rounded-full bg-muted" />
                    <Skeleton className="h-5 w-16 rounded-full bg-muted" />
                  </div>
                  <Skeleton className="h-8 w-3/4 sm:w-1/2 mx-auto lg:mx-0 rounded bg-muted" />
                </div>
                
                {/* Synopsis */}
                <div className="mx-auto max-w-4xl text-left lg:mx-0 space-y-2 pt-2">
                  <Skeleton className="h-3 w-16 bg-muted" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-full bg-muted" />
                    <Skeleton className="h-4 w-5/6 bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                  </div>
                </div>

                {/* Genres */}
                <div className="space-y-2 text-left pt-2">
                  <Skeleton className="h-3 w-12 bg-muted" />
                  <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                    <Skeleton className="h-6 w-16 rounded-full bg-muted" />
                    <Skeleton className="h-6 w-20 rounded-full bg-muted" />
                    <Skeleton className="h-6 w-14 rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content split skeleton */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Episode List Skeleton */}
          <div className="border rounded-xl bg-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28 bg-muted" />
                <Skeleton className="h-3 w-36 bg-muted" />
              </div>
              <Skeleton className="h-8 w-32 bg-muted" />
            </div>
            <div className="space-y-2 pt-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-[4rem_1fr_auto] sm:grid-cols-[5rem_1fr_auto] items-center gap-3 rounded-lg border border-border/70 p-3 bg-card/60">
                  <Skeleton className="aspect-video w-16 sm:w-20 bg-muted rounded-md shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-3 w-12 bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full bg-muted shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="border rounded-xl bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-16 bg-muted" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-border/60 pb-3 last:border-0">
                  <Skeleton className="h-3.5 w-16 bg-muted" />
                  <Skeleton className="h-3.5 w-24 bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="space-y-6">
        <Link
          href={`/providers/${provider}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Catalog
        </Link>
        <p className="py-12 text-center text-sm font-light text-muted-foreground">
          Show details not found.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <Link
        href={`/providers/${provider}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Catalog
      </Link>

      <MediaDetailsLayout
        details={details}
        provider={provider}
        activeTab={activeTab}
        episodes={releasedEpisodes}
        specials={releasedSpecials}
        loadingEpisodes={loadingEpisodes}
        currentPage={currentPage}
        totalCount={totalCount}
        perPage={24}
        onPageChange={setCurrentPage}
        onTabChange={setActiveTab}
        onSelectEpisode={handleSelectEpisode}
      />
    </div>
  )
}
