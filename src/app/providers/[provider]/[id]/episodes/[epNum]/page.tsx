import EpisodeClient from "./episode-client"

interface PageProps {
  params: Promise<{
    provider: string
    id: string
    epNum: string
  }>
}

export default async function EpisodePage({ params }: PageProps) {
  const resolvedParams = await params
  
  return (
    <EpisodeClient
      provider={resolvedParams.provider}
      mediaId={resolvedParams.id}
      epNum={resolvedParams.epNum}
    />
  )
}
