/* eslint-disable @next/next/no-html-link-for-pages -- AR-004: this page lives inside the `[locale]` segment, so a client-side Link here would pull the locale-aware navigation runtime into EVERY route's client chunk (the segment boundary) — the landing page's first-load budget does not have room for it. Plain anchors keep the 404 page dependency-free; the proxy resolves the locale on the way. */
import { Compass, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Compass className="size-6 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you were looking for doesn&apos;t exist or has moved.
            Check the address, or head back to the app.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild className="gap-2">
            <a href="/dashboard">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Go to dashboard
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Back home</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
