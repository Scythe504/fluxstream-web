"use client"
import { usePathname } from "next/navigation"

export default function PluginPage() {
  const pluginName = usePathname().split("/").pop()

  return <div>
    {pluginName}
  </div>
}