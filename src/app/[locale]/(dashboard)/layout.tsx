import { cookies } from "next/headers"

import { AppProviders } from "@/components/app-providers"
import { AppShell } from "@/components/layout/app-shell"

/**
 * Both cookie names are checked regardless of NODE_ENV: the bundle can be built
 * in one environment and served in another, so the shell must recognise the
 * cookie contract either way (same rule as middleware.ts).
 */
const SESSION_COOKIE_NAMES = ["__Host-auth_session", "auth_session"] as const

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cookie presence is what lets the shell render its children during SSR
  // (T14 §4). The middleware has already verified the signature, and
  // SessionInitializer remains the client-side authority — a stale cookie that
  // survived verification still gets redirected. Without this, every
  // authenticated page shipped a skeleton and the RSC prefetch was invisible.
  const cookieStore = await cookies()
  const hasSession = SESSION_COOKIE_NAMES.some((name) => Boolean(cookieStore.get(name)?.value))

  return (
    <AppProviders>
      <AppShell initialAuthenticated={hasSession}>{children}</AppShell>
    </AppProviders>
  )
}
