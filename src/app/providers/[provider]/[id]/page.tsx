import MediaDetailsClient from "./media-details-client"

interface PageProps {
  params: Promise<{
    provider: string
    id: string
  }>
}

export default async function MediaDetailsPage({ params }: PageProps) {
  const resolvedParams = await params
  return (
    <MediaDetailsClient
      provider={resolvedParams.provider}
      id={resolvedParams.id}
    />
  )
}
