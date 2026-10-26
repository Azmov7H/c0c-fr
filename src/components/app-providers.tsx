"use client"

import * as React from 'react'
import dynamic from 'next/dynamic'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionInitializer } from '@/components/session-initializer'
import { getQueryClient } from '@/lib/query-client'

/**
 * T20: the socket bridge imports `socket.io-client` and is a side-effect-only
 * component (renders `null`), so it has no reason to sit in the first-load
 * bundle of every dashboard route. `ssr: false` is honest — there is no socket
 * during SSR.
 */
const WebSocketInitializer = dynamic(
    () => import('@/components/websocket-initializer').then((mod) => mod.WebSocketInitializer),
    { ssr: false }
)

/**
 * Data-plane providers: react-query, session bootstrap, socket. Tooltip
 * providers are feature-local (T20: a global one pulled Popper into every
 * authenticated route's first-load graph).
 *
 * Mounted by the (auth) and (dashboard) layouts only. The marketing routes
 * mount nothing of this — see theme-provider.tsx for the reasoning (T11
 * performance budget) and theme-quick-toggle.tsx for the dependency-free
 * marketing toggle that replaced it.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
    // getQueryClient(): singleton in the browser, fresh per SSR render —
    // see src/lib/query-client.ts for why.
    const [queryClient] = React.useState(getQueryClient)

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="system" enableSystem>
                <SessionInitializer />
                <WebSocketInitializer />
                {children}
                <Toaster />
            </ThemeProvider>
        </QueryClientProvider>
    )
}
