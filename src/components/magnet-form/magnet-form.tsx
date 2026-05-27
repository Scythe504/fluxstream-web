"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useVideos } from "@/hooks/use-videos"

interface MagnetFormProps {
  onSuccess?: () => void
}

export const MagnetForm = ({ onSuccess }: MagnetFormProps) => {
  const [magnet, setMagnet] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const router = useRouter()
  const { createVideo } = useVideos()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!magnet || !magnet.toLowerCase().startsWith("magnet:")) {
      setError("Please enter a valid magnet link starting with magnet:.")
      return
    }

    setSubmitting(true)

    try {
      const videoId = await createVideo(magnet)
      if (!videoId) throw new Error("No video_id returned from server.")

      // reset state before redirect
      setSubmitting(false)
      setMagnet("")

      if (onSuccess) {
        onSuccess()
      }

      // client-side navigation (no reload)
      router.push(`/library/${encodeURIComponent(videoId)}`)
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-6">
      <div className="space-y-3">
        <label htmlFor="magnet" className="block text-sm font-semibold text-foreground">
          Magnet Link
        </label>
        <Input
          id="magnet"
          name="magnet"
          placeholder="magnet:?xt=urn:btih:..."
          value={magnet}
          onChange={(e) => setMagnet(e.target.value)}
          required
          aria-invalid={!!error}
          aria-describedby={error ? "magnet-error" : undefined}
          disabled={submitting}
          className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
        />
        {error ? (
          <p id="magnet-error" role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Paste a valid magnet link to stream content
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 h-10"
      >
        {submitting ? "Processing..." : "Get Video"}
      </Button>
    </form>
  )
}
