"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { ProviderClient } from "@/components/providers/provider-client"

export default function ProviderPage() {
  const params = useParams()
  const provider = params.provider as string

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      {provider && <ProviderClient provider={provider} />}
    </Suspense>
  )
}