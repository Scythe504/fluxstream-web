"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProviderSchedule } from "@/hooks/use-provider"
import { Skeleton } from "@/components/ui/skeleton"

interface GroupedScheduleItem {
  id: string | number
  number: string
  title: string
  image: string
  air_date: string | number
  overview?: string
  airingInfo: ReturnType<typeof getJstAiringInfo>
}
import { getJstAiringInfo } from "@/lib/schedule"
import { cn } from "@/lib/utils"

interface AiringScheduleProps {
  provider: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
]

export function AiringSchedule({ provider }: AiringScheduleProps) {
  const { schedule, loading, fetchSchedule } = useProviderSchedule(provider)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Format timestamp to locale time (HH:MM 24h format) on the client side
  const formatLocaleTime = React.useCallback((airDate: string | number) => {
    const date = new Date(typeof airDate === "number" ? airDate : Date.parse(airDate))
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
  }, [])

  // Get current JST day to select it by default (JST is UTC+9)
  const defaultDay = React.useMemo(() => {
    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const hour = nowJst.getUTCHours()
    let day = nowJst.getUTCDay()
    // 30-hour clock: JST late night hours (0:00 - 4:59 AM) are grouped under the previous day
    if (hour < 5) {
      day = (day - 1 + 7) % 7
    }
    return day
  }, [])

  const [activeDay, setActiveDay] = React.useState<number>(defaultDay)

  React.useEffect(() => {
    fetchSchedule(1, 100)
  }, [fetchSchedule])

  // Group and format schedule items
  const groupedSchedule = React.useMemo(() => {
    const groups: Record<number, GroupedScheduleItem[]> = {}
    
    schedule.forEach((ep) => {
      const airingInfo = getJstAiringInfo(ep.air_date)
      const adjustedDay = airingInfo.adjustedDay

      if (!groups[adjustedDay]) {
        groups[adjustedDay] = []
      }
      
      groups[adjustedDay].push({
        ...ep,
        airingInfo,
      })
    })

    // Sort items chronologically inside each day
    Object.keys(groups).forEach((dayKey) => {
      groups[Number(dayKey)].sort((a, b) => new Date(a.air_date).getTime() - new Date(b.air_date).getTime())
    })

    return groups
  }, [schedule])

  const activeDayEpisodes = groupedSchedule[activeDay] || []

  // Periodically refresh the relative timer countdowns every minute
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Weekly Airing Schedule
        </h3>
        
        {/* Day selection tabs */}
        <Tabs value={String(activeDay)} onValueChange={(val) => setActiveDay(Number(val))}>
          <TabsList className="bg-muted/40 border border-border/40 p-0.5 h-8 flex overflow-x-auto justify-start sm:justify-end scrollbar-hide max-w-fit">
            {DAYS_OF_WEEK.map((day) => (
              <TabsTrigger
                key={day.value}
                value={String(day.value)}
                className="h-7 text-xs font-semibold px-3 py-1 min-w-[45px]"
              >
                {day.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <ScrollArea className="h-[400px] rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm pr-1 animate-pulse">
          <div className="divide-y divide-border/40">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Skeleton className="w-10 h-13 rounded-md shrink-0 bg-muted" />
                  <div className="flex flex-col gap-2 min-w-0">
                    <Skeleton className="h-4 w-36 sm:w-48 bg-muted rounded" />
                    <Skeleton className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Skeleton className="h-4 w-12 bg-muted rounded" />
                  <Skeleton className="h-2 w-8 bg-muted rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : activeDayEpisodes.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground font-light bg-card/25 rounded-xl border border-dashed border-border/50">
          No releases scheduled for this day.
        </div>
      ) : (
        <ScrollArea className="h-[400px] rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm pr-1">
          <div className="divide-y divide-border/40">
            {activeDayEpisodes.map((ep) => {
              const { airingInfo } = ep
              const { relativeTime, isFuture } = airingInfo
              
              const hasValidLink = !!ep.id
              const absoluteTimeStr = mounted ? formatLocaleTime(ep.air_date) : "--:--"

              const rowContent = (
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Small cover image */}
                    {ep.image ? (
                      <Image 
                        src={ep.image} 
                        alt={ep.title} 
                        width={40}
                        height={52}
                        className="w-10 h-13 rounded-md object-cover border border-border/30 bg-muted shrink-0 shadow-sm group-hover:border-primary/40 transition-colors"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-13 rounded-md border border-border/30 bg-muted shrink-0 flex items-center justify-center text-[10px] text-muted-foreground font-light">
                        No Cover
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-normal text-sm">
                        {ep.title}
                      </span>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-zinc-400 dark:text-zinc-500">Ep {ep.number}</span>
                        <span className="text-zinc-600 dark:text-zinc-700 select-none">•</span>
                        <span className={cn(
                          "font-semibold",
                          isFuture ? "text-primary" : "text-zinc-500"
                        )}>
                          {relativeTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Absolute local time on extreme right */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-center">
                    <span className="tabular-nums font-semibold text-sm text-foreground dark:text-zinc-300">
                      {absoluteTimeStr}
                    </span>
                    <span className="text-[9px] text-muted-foreground/80 mt-0.5 tracking-wider uppercase">Local</span>
                  </div>
                </div>
              )

              if (hasValidLink) {
                return (
                  <Link
                    key={`${ep.id}-${ep.number}`}
                    href={`/providers/${provider}/${ep.id}`}
                    className="p-3.5 hover:bg-accent/20 transition-colors flex items-center group"
                  >
                    {rowContent}
                  </Link>
                )
              }

              return (
                <div key={`${ep.id}-${ep.number}`} className="p-3.5 hover:bg-accent/20 transition-colors flex items-center">
                  {rowContent}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
