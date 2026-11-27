import type { Metadata } from "next"
import { cookies } from "next/headers"
import { NextIntlClientProvider } from "next-intl"

import { AppProviders } from "@/components/app-providers"
import { AppShell } from "@/components/layout/app-shell"
import { getLocale, getMessages } from "@/i18n/server"

/**
 * Both cookie names are checked regardless of NODE_ENV: the bundle can be built
 * in one environment and served in another, so the shell must recognise the
 * cookie contract either way (same rule as middleware.ts).
 */
const SESSION_COOKIE_NAMES = ["__Host-auth_session", "auth_session"] as const

/**
 * AR-027 — every authenticated surface is private. The route table keeps these
 * paths out of the sitemap, and this keeps a URL someone links directly from
 * being indexed; it mirrors the auth segment's policy.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

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

  // AR-009: the app shell is the first surface that reads from a catalog.
  // The provider wraps AppProviders because the globally mounted socket bridge
  // reads `common` for realtime toasts; it hands client components the messages
  // of the locale they are rendered in, not the whole catalog.
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProviders>
        <AppShell initialAuthenticated={hasSession}>{children}</AppShell>
      </AppProviders>
    </NextIntlClientProvider>
  )
}
