/* eslint-disable @next/next/no-html-link-for-pages -- T20: see marketing-header.tsx; the footer is static chrome and its links cross a route group. */
import { Zap } from "lucide-react"

/**
 * Marketing footer. The dead-link audit (T11) removed nine links that 404'd:
 * /changelog, /docs, /about, /blog, /careers, /contact, /cookies and the
 * three social buttons that pointed at platform homepages (nobody was
 * linking to a real profile). What remains resolves: three landing anchors
 * and the two legal pages, which exist as minimal marked placeholders.
 *
 * T20: plain anchors, not `next/link` — the same route-group-boundary argument
 * as marketing-header.tsx. These are document navigations either way, and the
 * link runtime is a ~3 kB gzip client chunk on the landing budget.
 */
export function MarketingFooter() {
    return (
        <footer className="border-t py-12 bg-background/90 md:py-16 lg:py-20">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                    <div className="col-span-2 space-y-4">
                        <a href="/" className="flex items-center space-x-2">
                            <Zap className="h-6 w-6 text-primary" aria-hidden />
                            <span className="font-bold">AI Content Engine</span>
                        </a>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Thumbnails, scripts, sound effects and images — everything
                            a video needs, in one place.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold">Product</h2>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><a href="/#assets" className="hover:text-foreground">The four assets</a></li>
                            <li><a href="/#how-it-works" className="hover:text-foreground">How it works</a></li>
                            <li><a href="/pricing" className="hover:text-foreground">Pricing</a></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold">Legal</h2>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><a href="/privacy" className="hover:text-foreground">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-foreground">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 flex flex-col items-center justify-between border-t border-border/40 pt-8 sm:flex-row text-xs text-muted-foreground">
                    <p>© 2026 AI Content Engine. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
