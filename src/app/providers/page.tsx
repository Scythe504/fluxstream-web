"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star, ShieldCheck, AlertCircle, ExternalLink, Loader2, ArrowRight, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface Provider {
  id: string
  provider_name: string
  provider_url: string
  verification_pending: boolean
  version: string
  verified_at?: number
  provider_type: string
  created_at: number
}

interface SavedProvider extends Provider {
  is_verified_on_backend?: boolean
  last_validated_at?: number
}

export default function ProvidersIndexPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [savedProviders, setSavedProviders] = useState<SavedProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [revalidating, setRevalidating] = useState(false)

  // 1. Fetch verified providers from backend
  const fetchProviders = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRevalidating(true)

      const res = await fetch("/api/providers/")
      if (!res.ok) throw new Error("Failed to fetch verified providers")
      const data = await res.json()
      setProviders(data || [])
      return data as Provider[]
    } catch (err) {
      console.error("Failed to load providers:", err)
      toast.error("Failed to fetch providers from backend")
      return null
    } finally {
      setLoading(false)
      setRevalidating(false)
    }
  }

  // 2. Load saved providers from localStorage and revalidate on mount
  useEffect(() => {
    const loadAndRevalidate = async () => {
      let saved: SavedProvider[] = []
      const savedRaw = localStorage.getItem("fluxstream_saved_providers")
      if (savedRaw) {
        try {
          saved = JSON.parse(savedRaw)
          setSavedProviders(saved)
        } catch (e) {
          console.error("Failed to parse saved providers:", e)
        }
      }

      const fetched = await fetchProviders()

      if (fetched && saved.length > 0) {
        const updatedSaved = saved.map((item) => {
          const matched = fetched.find(
            (p) => p.provider_name.toLowerCase() === item.provider_name.toLowerCase()
          )
          return {
            ...item,
            ...(matched || {}),
            is_verified_on_backend: !!matched,
            last_validated_at: Date.now(),
          }
        })

        setSavedProviders(updatedSaved)
        localStorage.setItem("fluxstream_saved_providers", JSON.stringify(updatedSaved))
      }
    }

    loadAndRevalidate()
  }, [])

  // 3. Save a provider to favorites
  const handleSave = (provider: Provider) => {
    const isAlreadySaved = savedProviders.some(
      (p) => p.provider_name.toLowerCase() === provider.provider_name.toLowerCase()
    )
    if (isAlreadySaved) return

    const newSaved: SavedProvider = {
      ...provider,
      is_verified_on_backend: true,
      last_validated_at: Date.now(),
    }

    const updatedList = [...savedProviders, newSaved]
    setSavedProviders(updatedList)
    localStorage.setItem("fluxstream_saved_providers", JSON.stringify(updatedList))
    toast.success(`Saved ${provider.provider_name} to favorites`)
  }

  // 4. Remove a provider from favorites
  const handleUnsave = (providerName: string) => {
    const updatedList = savedProviders.filter(
      (p) => p.provider_name.toLowerCase() !== providerName.toLowerCase()
    )
    setSavedProviders(updatedList)
    localStorage.setItem("fluxstream_saved_providers", JSON.stringify(updatedList))
    toast.success(`Removed ${providerName} from favorites`)
  }

  const isSaved = (providerName: string) => {
    return savedProviders.some((p) => p.provider_name.toLowerCase() === providerName.toLowerCase())
  }

  return (
    <div className="py-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
            Media Providers
          </h1>
          <p className="text-xs text-muted-foreground">
            Browse verified catalog feeds and manage local configurations.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchProviders(true)}
          disabled={loading || revalidating}
          className="self-start sm:self-auto text-xs"
        >
          {revalidating ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Checking...
            </>
          ) : (
            "Refresh Tunnels"
          )}
        </Button>
      </div>

      <Tabs defaultValue="available" className="w-full space-y-6">
        <div className="border-b border-border pb-1">
          <TabsList className="bg-muted/40 border border-border/40 p-0.5 h-8.5">
            <TabsTrigger value="available" className="h-7.5 px-3.5 text-xs font-semibold">
              Available ({providers.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="h-7.5 px-3.5 text-xs font-semibold">
              Favorites ({savedProviders.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Available Providers */}
        <TabsContent value="available" className="focus-visible:outline-none m-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="aspect-square flex flex-col justify-between p-6">
                  <CardContent className="p-0 h-full flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-5 w-24 bg-muted" />
                        <Skeleton className="h-4 w-12 bg-muted" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-16 bg-muted" />
                        <Skeleton className="h-4 w-10 bg-muted" />
                      </div>
                      <Skeleton className="h-3 w-full bg-muted" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-8 flex-1 bg-muted" />
                      <Skeleton className="h-8 w-8 bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-border bg-card/20 text-center space-y-3 rounded-xl">
              <Compass className="h-6 w-6 text-muted-foreground animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-300 uppercase">No active providers found</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Confirm the `fluxstream-providers` microservice is running and registered correctly.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {providers.map((prov) => (
                <Card
                  key={prov.id}
                  className="aspect-square flex flex-col justify-between p-6 hover:bg-accent/40 transition-colors duration-200"
                >
                  <CardContent className="p-0 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-base tracking-tight text-foreground truncate max-w-[80%]">
                          {prov.provider_name}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground border border-border bg-muted/30 px-2 py-0.5 rounded">
                          <ShieldCheck className="h-3 w-3" />
                          <span>OK</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                        <span className="border border-border bg-muted/40 text-zinc-300 px-2 py-0.5 rounded">
                          {prov.provider_type}
                        </span>
                        <span className="border border-border bg-muted/40 text-zinc-400 px-2 py-0.5 rounded">
                          v{prov.version}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <span className="truncate" title={prov.provider_url}>{prov.provider_url}</span>
                        <a
                          href={prov.provider_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground transition-colors shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs font-semibold"
                        asChild
                      >
                        <Link href={`/providers/${prov.provider_name.toLowerCase()}`}>
                          Browse
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          if (isSaved(prov.provider_name)) {
                            handleUnsave(prov.provider_name)
                          } else {
                            handleSave(prov)
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title={isSaved(prov.provider_name) ? "Remove from favorites" : "Save to favorites"}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${
                            isSaved(prov.provider_name)
                              ? "fill-foreground text-foreground"
                              : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Saved Favorites */}
        <TabsContent value="favorites" className="focus-visible:outline-none m-0">
          {savedProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border bg-card/10 text-center space-y-3 rounded-xl">
              <Star className="h-6 w-6 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-300 uppercase">No saved favorites</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Star providers in the Available tab to keep them saved here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {savedProviders.map((prov) => (
                <Card
                  key={prov.provider_name}
                  className="aspect-square flex flex-col justify-between p-6 hover:bg-accent/40 transition-colors duration-200"
                >
                  <CardContent className="p-0 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-extrabold text-base tracking-tight text-foreground truncate max-w-[80%]">
                          {prov.provider_name}
                        </h3>
                        <div>
                          {prov.is_verified_on_backend ? (
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground border border-border bg-muted/30 px-2 py-0.5 rounded">
                              <ShieldCheck className="h-3 w-3" />
                              <span>OK</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground border border-border bg-muted/10 px-2 py-0.5 rounded line-through">
                              <AlertCircle className="h-3 w-3" />
                              <span>OFF</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                        <span className="border border-border bg-muted/40 text-zinc-300 px-2 py-0.5 rounded">
                          {prov.provider_type}
                        </span>
                        <span className="border border-border bg-muted/40 text-zinc-400 px-2 py-0.5 rounded">
                          v{prov.version}
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-foreground font-mono truncate" title={prov.provider_url}>
                        {prov.provider_url}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs font-semibold"
                        disabled={!prov.is_verified_on_backend}
                        asChild
                      >
                        <Link href={`/providers/${prov.provider_name.toLowerCase()}`}>
                          Browse
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleUnsave(prov.provider_name)}
                        className="h-8 w-8 text-foreground"
                        title="Remove from favorites"
                      >
                        <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
