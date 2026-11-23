"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reportClientError } from "@/lib/report-error"

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
  const t = useTranslations("errors")

  useEffect(() => {
    console.error("Dashboard route error:", error)
    // Lazy Sentry reporter (T21) — no client SDK on a healthy page load.
    reportClientError(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">{t("route.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("route.description")}</p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">
              {t("route.supportReference")}{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                {error.digest}
              </code>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="size-4" aria-hidden="true" />
            {t("route.retry")}
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard">
              <Home className="size-4" aria-hidden="true" />
              {t("route.backToDashboard")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
