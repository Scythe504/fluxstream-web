import { Episode } from "@/hooks/use-provider"

const DAY_MS = 24 * 60 * 60 * 1000

export const formatLabel = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-"

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const parseEpisodeDate = (value: string | number | null | undefined) => {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const isFutureEpisode = (episode: Episode, now = new Date()) => {
  const airDate = parseEpisodeDate(episode.air_date)
  if (!airDate) return false

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  return airDate.getTime() > todayEnd.getTime()
}

export const filterReleasedEpisodes = (episodes: Episode[], now = new Date()) =>
  episodes.filter((episode) => !isFutureEpisode(episode, now))

export const formatAirDate = (value: string | number | null | undefined, now = new Date()) => {
  const date = parseEpisodeDate(value)
  if (!date) return ""

  if (date.getFullYear() === now.getFullYear() && date.getTime() <= now.getTime()) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const daysAgo = Math.max(0, Math.floor((startOfToday.getTime() - startOfDate.getTime()) / DAY_MS))

    if (daysAgo === 0) return "Today"
    if (daysAgo === 1) return "Yesterday"
    return `${daysAgo} days ago`
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

export const formatTimeUntil = (value: number | string | Date, now = new Date()) => {
  const date = value instanceof Date ? value : new Date(typeof value === "number" ? value * 1000 : value)
  const diffMs = date.getTime() - now.getTime()

  if (Number.isNaN(date.getTime())) return "soon"
  if (diffMs <= 0) return "now"

  const days = Math.floor(diffMs / DAY_MS)
  const hours = Math.floor((diffMs % DAY_MS) / (60 * 60 * 1000))
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))

  if (days > 1) return `${days} days`
  if (days === 1) return hours > 0 ? `1 day ${hours} hr` : "1 day"
  if (hours > 1) return `${hours} hrs`
  if (hours === 1) return minutes > 0 ? `1 hr ${minutes} min` : "1 hr"
  if (minutes > 1) return `${minutes} min`
  return "less than a minute"
}

export const formatRating = (score: number | null | undefined) => {
  if (!score) return "-"
  return score <= 10 ? `${score.toFixed(1)}/10` : `${Math.round(score)}%`
}
