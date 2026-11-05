/* eslint-disable @next/next/no-html-link-for-pages -- T20: these are document navigations to another route group; next/link would add a client chunk to the 140 kB landing budget. */
import { MarketingCtaLink } from "@/components/layout/marketing-cta"
import { ThemeQuickToggle } from "@/components/theme-quick-toggle"
import { Zap } from "lucide-react"

/**
 * Marketing header. Every link here resolves to a real target (T11 AC2):
 * the three anchors exist on the landing page (`#assets`, `#how-it-works`,
 * `#pricing` — written as `/#…` so they also work from /privacy and /terms,
 * which share this layout), and the CTAs point at /login and /signup.
 *
 * The old "Get Started" → /signup link was correct here all along — it was
 * /signup itself that did not exist. It does now.
 *
 * T20: plain anchors, not `next/link`. The marketing chrome is server-rendered
 * and these targets are either same-page anchors or a route-group boundary
 * (/login, /signup, /pricing) where a document navigation is indistinguishable
 * to the visitor — while the App Router link component is a ~3 kB gzip client
 * chunk on the one route with the tightest budget.
 */
export function MarketingHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md">
            <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
                <div className="flex md:flex-1">
                    <a href="/" className="flex items-center space-x-2" aria-label="AI Content Engine">
                        <Zap className="h-6 w-6 text-primary" aria-hidden />
                        <span className="hidden font-bold sm:inline-block">
                            AI Content Engine
                        </span>
                    </a>
                </div>

                <nav
                    aria-label="Marketing"
                    className="hidden md:flex flex-1 items-center justify-center space-x-6 text-sm font-medium"
                >
                    <a href="/#assets" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        The four assets
                    </a>
                    <a href="/#how-it-works" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        How it works
                    </a>
                    <a href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Pricing
                    </a>
                </nav>

                <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
                    <ThemeQuickToggle />
                    <MarketingCtaLink href="/login" variant="ghost">
                        Log in
                    </MarketingCtaLink>
                    <MarketingCtaLink href="/signup">Get Started</MarketingCtaLink>
                </div>
            </div>
        </header>
    )
}
