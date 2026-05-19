'use client'
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

export const HeroSection = () => {
  const router = useRouter()
  const routeToMagnetLinkForm = () => {
    router.push("/library")
  }

  return <div className="relative min-h-screen overflow-hidden">
    <div className="relative z-10 flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 items-center justify-center min-h-screen w-full px-5 sm:px-20">
          <div className="relative z-10 flex max-w-4xl flex-col items-center gap-8 text-center">
            <h1 className="text-2xl sm:text-4xl font-bold leading-tight tracking-tight md:text-7xl text-balance drop-shadow-2xl">
              Stream Torrents Instantly
            </h1>
            <p className="text-sm sm:text-xl max-w-3xl text-pretty drop-shadow-lg">
              FluxStream transforms torrents into living streams watch instantly while data flows in. No waiting, no setup, just pure playback magic.
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={routeToMagnetLinkForm}
            >Stream Now</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
}