"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useProviderRecommendations } from "@/hooks/use-provider"
import { PaginatedMediaViewer } from "./paginated-media-viewer"

interface MediaRecommendationsProps {
  provider: string
  mediaId: string
}

export function MediaRecommendations({ provider, mediaId }: MediaRecommendationsProps) {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const perPage = 5
  const { recommendations, loading, hasNextPage } = useProviderRecommendations(provider, mediaId, page, perPage)

  return (
    <PaginatedMediaViewer
      title="Recommendations"
      description="More titles similar to this one."
      media={recommendations}
      loading={loading}
      page={page}
      hasNextPage={hasNextPage}
      onPageChange={setPage}
      onSelectMedia={(media) => router.push(`/providers/${provider}/${media.id}`)}
      emptyMessage="No recommendations found."
    />
  )
}
