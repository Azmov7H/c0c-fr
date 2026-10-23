import Link from "next/link"
import { Zap } from "lucide-react"

/**
 * Marketing footer. The dead-link audit (T11) removed nine links that 404'd:
 * /changelog, /docs, /about, /blog, /careers, /contact, /cookies and the
 * three social buttons that pointed at platform homepages (nobody was
 * linking to a real profile). What remains resolves: three landing anchors
 * and the two legal pages, which exist as minimal marked placeholders.
 */
export function MarketingFooter() {
    return (
        <footer className="border-t py-12 bg-background/90 md:py-16 lg:py-20">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                    <div className="col-span-2 space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Zap className="h-6 w-6 text-primary" aria-hidden />
                            <span className="font-bold">AI Content Engine</span>
                        </Link>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Thumbnails, scripts, sound effects and images — everything
                            a video needs, in one place.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold">Product</h2>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/#assets" className="hover:text-foreground">The four assets</Link></li>
                            <li><Link href="/#how-it-works" className="hover:text-foreground">How it works</Link></li>
                            <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold">Legal</h2>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
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
