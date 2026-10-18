"use client"

import React from "react"
import { AppSidebar } from "./sidebar"
import { Header } from "./header"
import { ConnectionBanner } from "./connection-banner"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/auth-store"

/**
 * Rendered while the session is still resolving, shaped like the real shell
 * (sidebar column, header bar, content blocks) so nothing shifts when the
 * app replaces it. This is also what signed-out visitors see for the
 * instant before the session initializer redirects them — never the
 * authenticated chrome with an empty user, and never page content.
 */
function ShellSkeleton() {
    return (
        <div className="flex min-h-screen w-full bg-background" aria-busy="true">
            <span className="sr-only" role="status">Loading session</span>

            {/* Sidebar column (matches w-64 default) */}
            <div className="hidden md:flex w-64 shrink-0 flex-col gap-3 border-r border-border/60 p-4">
                <Skeleton className="h-9 w-32 motion-reduce:animate-none" />
                <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-20 motion-reduce:animate-none" />
                    <Skeleton className="h-9 w-full motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
                    <Skeleton className="h-9 w-full motion-reduce:animate-none" />
                    <Skeleton className="h-9 w-full motion-reduce:animate-none" />
                    <Skeleton className="h-9 w-full motion-reduce:animate-none" />
                </div>
                <div className="mt-auto flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
                </div>
            </div>

            {/* Content column */}
            <div className="flex flex-1 flex-col min-w-0">
                <div className="flex h-14 items-center gap-3 border-b border-border/60 px-4 md:px-6">
                    <Skeleton className="h-7 w-7 motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-40 motion-reduce:animate-none" />
                    <Skeleton className="ml-auto hidden h-9 w-64 md:block motion-reduce:animate-none" />
                </div>

                <main className="flex-1">
                    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-56 motion-reduce:animate-none" />
                            <Skeleton className="h-4 w-80 motion-reduce:animate-none" />
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-2xl motion-reduce:animate-none" />
                            ))}
                        </div>
                        <Skeleton className="h-72 w-full rounded-xl motion-reduce:animate-none" />
                    </div>
                </main>
            </div>
        </div>
    )
}

/**
 * Client gate around the whole authenticated shell (T10):
 * the app chrome only paints once the session has resolved AND a user is
 * present. Without this, a signed-out visitor watched the full sidebar and
 * header flash before the redirect — and protected page fetches started
 * against no session.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
    const isLoading = useAuthStore((s) => s.isLoading)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

    if (isLoading || !isAuthenticated) {
        return <ShellSkeleton />
    }

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "16rem",
                    "--sidebar-width-mobile": "18rem",
                } as React.CSSProperties
            }
        >
            <a
                href="#main-content"
                className="
                    sr-only focus:not-sr-only
                    focus:fixed focus:left-4 focus:top-4 focus:z-50
                    focus:rounded-md focus:bg-background focus:px-3 focus:py-2
                    focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring
                "
            >
                Skip to content
            </a>

            <div className="flex min-h-screen w-full bg-background">

                {/* Sidebar */}
                <AppSidebar />

                {/* Content Area */}
                <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

                    {/* Header */}
                    <Header />

                    <ConnectionBanner />

                    {/* Page Content */}
                    <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto">
                        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
                            {children}
                        </div>
                    </main>

                </div>
            </div>
        </SidebarProvider>
    )
}
