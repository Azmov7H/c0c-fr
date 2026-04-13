"use client"

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionInitializer } from '@/components/session-initializer'
import { WebSocketInitializer } from '@/components/websocket-initializer'

export function Providers({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,
                        gcTime: 10 * 60 * 1000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

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
