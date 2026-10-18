"use client"

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionInitializer } from '@/components/session-initializer'
import { WebSocketInitializer } from '@/components/websocket-initializer'
import { getQueryClient } from '@/lib/query-client'

export function Providers({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    // getQueryClient(): singleton in the browser, fresh per SSR render —
    // see src/lib/query-client.ts for why.
    const [queryClient] = React.useState(getQueryClient)

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider {...props}>
                <TooltipProvider>
                    <SessionInitializer />
                    <WebSocketInitializer />
                    {children}
                </TooltipProvider>
            </NextThemesProvider>
        </QueryClientProvider>
    )
}
