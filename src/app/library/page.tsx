import { Library } from "@/components/home/library"

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Media Library</h1>
        <p className="text-muted-foreground">Manage and stream your active torrents.</p>
      </div>

      {/* <Header /> */}

      <div className="pt-2">
        <Library />
      </div>
    </div>
  )
}
