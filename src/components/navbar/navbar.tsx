"use client"

import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className={`flex h-16 shrink-0 items-center justify-between px-4 transition-all duration-300 sticky top-0 z-30 ${
      isScrolled ? "bg-background/80 border-b backdrop-blur-md" : "bg-transparent"
    }`}>
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      <ThemeToggle />
    </header>
  )
}
