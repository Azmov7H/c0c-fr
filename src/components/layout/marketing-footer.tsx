import Link from "next/link"
import { Zap } from "lucide-react"

export function MarketingFooter() {
    return (
        <footer className="border-t py-12 bg-background/90 md:py-16 lg:py-20">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-5">
                    <div className="col-span-2 lg:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <Zap className="h-6 w-6 text-primary" />
                            <span className="font-bold">AI Content Engine</span>
                        </Link>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Empowering creators and businesses to generate high-performing content effortlessly.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Product</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                            <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                            <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
                            <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Company</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                            <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                            <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Legal</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                            <li><Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 flex flex-col items-center justify-between border-t border-border/40 pt-8 sm:flex-row text-xs text-muted-foreground">
                    <p>© 2026 AI Content Engine. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 sm:mt-0">
                        {/* Social Icons would go here */}
                        <Link href="https://twitter.com" className="hover:text-foreground">Twitter</Link>
                        <Link href="https://github.com" className="hover:text-foreground">GitHub</Link>
                        <Link href="https://linkedin.com" className="hover:text-foreground">LinkedIn</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
