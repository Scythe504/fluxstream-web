"use client"

import { useState } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuRadioGroup,
//   DropdownMenuRadioItem,
// } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MagnetForm } from "../magnet-form/magnet-form"
import { PlusCircle } from "lucide-react"

export const Header = () => {
  // const [filter, setFilter] = useState("all")
  const [open, setOpen] = useState(false)

  return (
    <Card className="p-2 border-0 bg-card/80 backdrop-blur-md">
      <CardContent className="flex justify-between items-center px-2">
        <CardTitle className="md:text-xl font-mono tracking-wide">
          Manage Streams
        </CardTitle>

        <div className="flex gap-2">
          {/* Filter dropdown */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="w-28">
                {filter === "all"
                  ? "Filter By"
                  : `Filter: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuRadioGroup
                value={filter}
                onValueChange={setFilter}
              >
                <DropdownMenuRadioItem value="all">
                  All
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="processing">
                  Processing
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="downloading">
                  Downloading
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="downloaded">
                  Downloaded
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* Add Torrent dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="flex gap-1 items-center"
              >
                Add Torrent <PlusCircle />
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Torrent</DialogTitle>
                <DialogDescription>
                  Paste a magnet link to start streaming.
                </DialogDescription>
              </DialogHeader>

              <MagnetForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
