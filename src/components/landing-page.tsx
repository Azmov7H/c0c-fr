import Link from 'next/link';
import { Hero } from '../features/landing/components/hero';
import { FeaturesGrid } from '../features/landing/components/features-grid';
import { Button } from './ui/button';
import Footer from './layout/footer';
import Navigation from './layout/navigation';
export default function LandingPage() {
    return (
        <div className="min-h-screen  selection:bg-primary/30">
            {/* Navigation */}
            <Navigation />

            <main>
                <Hero />
                <div id="features">
                    <FeaturesGrid />
                </div>

                {/* FAQ Preview / Final CTA */}
                <section className="py-32 container px-4 mx-auto text-center border-t border-white/5">
                    <h2 className="text-4xl md:text-6xl font-bold  mb-8">Ready to automate your <br /> content production?</h2>
                    <p className="text-muted-foreground mb-12 max-w-xl mx-auto">Join the 500+ creators and agencies building the future of algorithmic content with Arch-AI.</p>
                    <Link href="/register">
                        <Button size="lg" className="h-16 px-12 text-lg rounded-2xl bg-primary hover:bg-primary/90">
                            Claim Your Account
                        </Button>
                    </Link>
                </section>
            </main>
            <Footer />
         
        </div>
    );
}
