import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Zap } from "lucide-react"

export function MarketingHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md">
            <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4 md:px-6">
                <div className="flex md:flex-1">
                    <Link href="/" className="flex items-center space-x-2">
                        <Zap className="h-6 w-6 text-primary" />
                        <span className="hidden font-bold sm:inline-block">
                            AI Content Engine
                        </span>
                    </Link>
                </div>

                <nav className="hidden md:flex flex-1 items-center justify-center space-x-6 text-sm font-medium">
                    <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Features
                    </Link>
                    <Link href="#benefits" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Benefits
                    </Link>
                    <Link href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        Pricing
                    </Link>
                </nav>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-2">
                        <ThemeToggle />
                        <div className="hidden sm:block space-x-2">
                            <Button variant="ghost" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/signup">Get Started</Link>
                            </Button>
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    )
}
