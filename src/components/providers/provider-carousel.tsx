'use client'

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Play, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Media } from "@/hooks/use-provider"
import { formatRating } from "./provider-media-utils"

interface ProviderCarouselProps {
  provider: string
  trending: Media[]
  loading: boolean
}

export function ProviderCarousel({ provider, trending, loading }: ProviderCarouselProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [isHovering, setIsHovering] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Reset current slide when trending list updates
  React.useEffect(() => {
    setCurrentSlide(0)
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0
    }
  }, [trending])

  const scrollToSlide = React.useCallback((idx: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: idx * scrollRef.current.clientWidth,
        behavior: "smooth"
      })
      setCurrentSlide(idx)
    }
  }, [])

  // Autoplay sliding timer
  React.useEffect(() => {
    if (trending.length === 0 || isHovering) return
    const interval = setInterval(() => {
      const nextIndex = (currentSlide + 1) % trending.length
      scrollToSlide(nextIndex)
    }, 5000)
    return () => clearInterval(interval)
  }, [trending.length, isHovering, currentSlide, scrollToSlide])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const scrollLeft = container.scrollLeft
    const width = container.clientWidth
    if (width > 0) {
      const index = Math.round(scrollLeft / width)
      // Only update if index has actually changed to avoid triggering state updates unnecessarily
      if (index !== currentSlide && index >= 0 && index < trending.length) {
        setCurrentSlide(index)
      }
    }
  }

  if (loading) {
    return (
      <div className="w-full aspect-video md:aspect-[2.4/1] rounded-xl bg-muted animate-pulse border border-border" />
    )
  }

  if (trending.length === 0) return null

  return (
    <div 
      className="relative w-full aspect-video md:aspect-[2.4/1] overflow-clip rounded-xl border border-border bg-card group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hide"
      >
        {trending.map((slide, idx) => (
          <div
            key={slide.id}
            className="w-full h-full flex-shrink-0 snap-start relative group/slide cursor-pointer overflow-hidden"
          >
            {/* Link wrapper for the slide itself */}
            <Link 
              href={`/providers/${provider}/${slide.id}`}
              className="absolute inset-0 block z-0"
              aria-label={`View details for ${slide.title}`}
            >
              {/* Background Image */}
              {(slide.banner || slide.cover) ? (
                <Image
                  src={slide.banner || slide.cover}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  className="object-cover transition-transform duration-700 group-hover/slide:scale-102"
                  priority={idx === 0}
                  loading={idx === 0 ? undefined : "lazy"}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-xs font-light">No Banner Available</span>
                </div>
              )}
              
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent md:bg-gradient-to-r md:from-background/95 md:via-background/60 md:to-transparent" />
            </Link>

            {/* Slide Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 space-y-3 sm:space-y-4 max-w-2xl text-left pointer-events-none">
              <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
                {(slide.genres || []).slice(0, 3).map((genre) => (
                  <span key={genre} className="text-[10px] sm:text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-medium">
                    {genre}
                  </span>
                ))}
                {slide.score > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] sm:text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {formatRating(slide.score)}
                  </span>
                )}
              </div>
              
              <Link 
                href={`/providers/${provider}/${slide.id}`}
                className="block pointer-events-auto hover:underline"
              >
                <h2 className="text-lg sm:text-3xl font-semibold text-foreground tracking-tight leading-tight line-clamp-1 sm:line-clamp-2">
                  {slide.title}
                </h2>
              </Link>
              
              {slide.description && (
                <p 
                  className="text-[11px] sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed font-light"
                  dangerouslySetInnerHTML={{ __html: slide.description }}
                />
              )}
              
              <div className="flex items-center gap-2 pt-1 pointer-events-auto">
                <Button asChild size="sm" className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm font-medium shadow-md">
                  <Link href={`/providers/${provider}/${slide.id}/episodes/1`}>
                    <Play className="w-3.5 h-3.5 fill-current mr-1.5 sm:w-4 sm:h-4 sm:mr-2" />
                    Watch Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination indicators */}
      <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-10">
        {trending.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation()
              scrollToSlide(idx)
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              (currentSlide === idx || (currentSlide >= trending.length && idx === 0)) ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

