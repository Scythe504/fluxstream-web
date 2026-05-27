"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(query)

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Extract provider from pathname (e.g., "/providers/aniflux" or "/providers/aniflux/123")
  const getProviderName = () => {
    const match = pathname.match(/^\/providers\/([^/]+)/)
    return match ? match[1] : null
  }
  const provider = getProviderName()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push(`/providers/${provider}?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push(`/providers/${provider}`)
    }
  }

  return (
    <header className={`flex h-16 shrink-0 items-center justify-between px-4 transition-all duration-300 sticky top-0 z-30 ${
      isScrolled ? "bg-background/80 border-b backdrop-blur-md" : "bg-transparent"
    }`}>
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {provider && (
          <span className="text-sm font-semibold tracking-tight text-foreground capitalize">
            {provider}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {provider && (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative w-44 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-8 w-full text-xs"
              />
            </div>
          </form>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
