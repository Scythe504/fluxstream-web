import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

export interface Airing {
  episode: number
  airing_at: number
}

export interface Media {
  id: string
  type: "anime" | "movie" | "series"
  title: string
  original_title: string
  cover: string
  banner: string
  description: string
  score: number
  genres: string[]
  status: "RELEASING" | "FINISHED" | "CANCELLED" | "NOT_YET_AIRED"
  season: "FALL" | "SPRING" | "WINTER" | "SUMMER"
  season_year: number
  total_episodes: number | null
  duration: number | null
  next_airing: Airing | null
}

export interface Episode {
  id: number
  number: string
  title: string
  air_date: string | number
  overview: string
  image: string
}

export interface Source {
  title: string
  magnet_uri: string
  seeders: number
  leechers: number
  size: number
  info_hash: string
}

interface PaginatedMediaOptions {
  page?: number
  perPage?: number
  query?: string
  season?: string | null
  year?: string | number | null
  genre?: string | null
  enabled?: boolean
}

const buildProviderURL = (provider: string, endpoint: string, params: Record<string, string | number | null | undefined>) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return `/api/providers/${provider}${endpoint}${query ? `?${query}` : ""}`
}

export const useProviderPaginatedMedia = (
  provider: string,
  endpoint: "/trending" | "/search" | "/seasonal" | "/genre" | "/airing",
  {
    page = 1,
    perPage = 24,
    query,
    season,
    year,
    genre,
    enabled = true,
  }: PaginatedMediaOptions = {}
) => {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!provider || !enabled) return

    const fetchMedia = async () => {
      try {
        setLoading(true)
        const res = await fetch(buildProviderURL(provider, endpoint, {
          page,
          perPage,
          q: query,
          season,
          year,
          genre,
        }))
        if (!res.ok) throw new Error("Failed to fetch media")
        const data = await res.json()
        setMedia(data || [])
      } catch (err) {
        console.error({err})
        toast.error("Failed to load media")
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [provider, endpoint, page, perPage, query, season, year, genre, enabled])

  return { media, loading, hasNextPage: media.length >= perPage }
}

export const useProviderRecommendations = (provider: string, mediaId: string, page = 1, perPage = 5) => {
  const [recommendations, setRecommendations] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!provider || !mediaId) return

    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        const res = await fetch(buildProviderURL(provider, `/${mediaId}/recommendations`, { page, perPage }))
        if (!res.ok) throw new Error("Failed to fetch recommendations")
        const data = await res.json()
        setRecommendations(data || [])
      } catch (err) {
        console.error(err)
        toast.error("Failed to load recommendations")
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [provider, mediaId, page, perPage])

  return { recommendations, loading, hasNextPage: recommendations.length >= perPage }
}

export const useProviderTrending = (provider: string) => {
  const [trending, setTrending] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true)
        const res = await fetch(buildProviderURL(provider, "/trending", { page: 1, perPage: 5 }))
        if (!res.ok) throw new Error("Failed to fetch trending media")
        const data = await res.json()
        setTrending(data || [])
      } catch (err) {
        console.error(err)
        toast.error("Failed to load trending feed")
      } finally {
        setLoading(false)
      }
    }
    if (provider) fetchTrending()
  }, [provider])

  return { trending, loading }
}

export const useProviderEpisodes = (provider: string) => {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [specials, setSpecials] = useState<Episode[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const fetchEpisodes = useCallback(async (mediaId: string, page = 1, perPage = 24) => {
    setEpisodes([])
    setSpecials([])
    setTotalCount(0)
    try {
      setLoading(true)
      const res = await fetch(`/api/providers/${provider}/${mediaId}/episodes?page=${page}&perPage=${perPage}`)
      if (!res.ok) throw new Error("Failed to fetch episodes")
      const data = await res.json()
      setEpisodes(data.episodes || [])
      setSpecials(data.specials || [])
      setTotalCount(data.total_count || 0)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load episodes for this title")
    } finally {
      setLoading(false)
    }
  }, [provider])

  return { episodes, specials, totalCount, loading, fetchEpisodes }
}

export const useProviderSources = (provider: string) => {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSources = useCallback(async (mediaId: string, epNumber: string) => {
    setSources([])
    try {
      setLoading(true)
      const res = await fetch(`/api/providers/${provider}/${mediaId}/episodes/${epNumber}/sources`)
      if (!res.ok) throw new Error("Failed to fetch torrent sources")
      const data = await res.json()
      setSources(data || [])
      if (data && data.length === 0) {
        toast.info("No streamable torrents found for this episode.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch torrent options")
    } finally {
      setLoading(false)
    }
  }, [provider])

  const clearSources = useCallback(() => {
    setSources([])
  }, [])

  return { sources, loading, fetchSources, clearSources }
}

export const useProviderDetails = (provider: string) => {
  const [details, setDetails] = useState<Media | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDetails = useCallback(async (mediaId: string) => {
    if (!mediaId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/providers/${provider}/${mediaId}`)
      if (!res.ok) throw new Error("Failed to fetch media details")
      const data = await res.json()
      setDetails(data || null)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load details for this title")
    } finally {
      setLoading(false)
    }
  }, [provider])

  return { details, loading, fetchDetails }
}

export const useProviderSchedule = (provider: string) => {
  const [schedule, setSchedule] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSchedule = useCallback(async (page = 1, perPage = 100) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/providers/${provider}/schedule?page=${page}&perPage=${perPage}`)
      if (!res.ok) throw new Error("Failed to fetch schedule")
      const data = await res.json()
      setSchedule(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load airing schedule")
    } finally {
      setLoading(false)
    }
  }, [provider])

  return { schedule, loading, fetchSchedule }
}
