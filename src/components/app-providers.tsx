"use client"

import * as React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionInitializer } from '@/components/session-initializer'
import { WebSocketInitializer } from '@/components/websocket-initializer'
import { getQueryClient } from '@/lib/query-client'

/**
 * Data-plane providers: react-query, tooltips, session bootstrap, socket.
 *
 * Mounted by the (auth) and (dashboard) layouts only. The marketing routes
 * mount nothing of this — see theme-provider.tsx for the reasoning (T11
 * performance budget). ThemeProvider stays at the root because the marketing
 * header toggle needs it.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
    // getQueryClient(): singleton in the browser, fresh per SSR render —
    // see src/lib/query-client.ts for why.
    const [queryClient] = React.useState(getQueryClient)

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <TooltipProvider>
                    <SessionInitializer />
                    <WebSocketInitializer />
                    {children}
                    <Toaster />
                </TooltipProvider>
            </ThemeProvider>
        </QueryClientProvider>
    )
}
