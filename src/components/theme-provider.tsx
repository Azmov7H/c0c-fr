"use client"

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Theme only — deliberately the thinnest provider level.
 *
 * The marketing routes need `next-themes` for the header toggle and nothing
 * else. Everything data-shaped (react-query, the socket, the session fetch)
 * lives in AppProviders, which only the authenticated and auth route groups
 * mount. A landing page that ships the query client and the socket
 * initialiser to every visitor is paying for infrastructure it never uses —
 * the T11 performance budget is the reason for the split (card: "no
 * charting, no socket, no query library on this route").
 */
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
