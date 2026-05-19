import { Header } from "@/components/home/header"
import { Library } from "@/components/home/library"

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-background pt-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Media Library</h1>
          <p className="text-muted-foreground">Manage and stream your active torrents.</p>
        </div>
        
        {/* <Header /> */}
        
        <div className="pt-4">
          <Library />
        </div>
      </div>
    </main>
  )
}
