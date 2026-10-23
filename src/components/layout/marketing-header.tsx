import Link from "next/link"
import { Button } from "@/components/ui/button"
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
 */
export function MarketingHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md">
            <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
                <div className="flex md:flex-1">
                    <Link href="/" className="flex items-center space-x-2" aria-label="AI Content Engine">
                        <Zap className="h-6 w-6 text-primary" aria-hidden />
                        <span className="hidden font-bold sm:inline-block">
                            AI Content Engine
                        </span>
                    </Link>
                </div>

                <nav
                    aria-label="Marketing"
                    className="hidden md:flex flex-1 items-center justify-center space-x-6 text-sm font-medium"
                >
                    <Link href="/#assets" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        The four assets
                    </Link>
                    <Link href="/#how-it-works" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        How it works
                    </Link>
                    <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Pricing
                    </Link>
                </nav>

                <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
                    <ThemeQuickToggle />
                    <Button variant="ghost" asChild>
                        <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signup">Get Started</Link>
                    </Button>
                </div>
            </div>
        </header>
    )
}
