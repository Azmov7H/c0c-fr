"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Route-level boundary for every authenticated page (T10). Shows a recovery
 * affordance — retry via reset(), plus a way out — instead of a stack trace.
 * `error.digest` is the server-side hash Next attaches to the original error;
 * it is the reference a support conversation can actually use.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            This page hit an unexpected error. Trying again usually clears it.
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">
              Support reference:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                {error.digest}
              </code>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard">
              <Home className="size-4" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
