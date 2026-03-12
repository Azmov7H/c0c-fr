import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart2, CheckCircle2, Layout, Shield, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'AI Content Engine | Supercharge Your Workflow',
    description: 'The ultimate tool to manage projects, generate insights, and convert leads at scale.',
};

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center w-full">
            {/* 1. Hero Section */}
            <section className="relative w-full overflow-hidden bg-background pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
                {/* Abstract shapes for background */}
                <div className="absolute top-0 -z-10 h-full w-full bg-white dark:bg-background">
                    <div className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[10%] translate-y-[20%] rounded-full bg-primary/20 opacity-50 blur-[80px]" />
                    <div className="absolute bottom-0 left-0 right-auto top-auto h-[500px] w-[500px] -translate-y-[10%] translate-x-[20%] rounded-full bg-secondary/20 opacity-50 blur-[80px]" />
                </div>

                <div className="container mx-auto px-4 md:px-6 text-center">
                    <div className="mx-auto flex max-w-[800px] flex-col items-center space-y-8">
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary shadow-sm">
                            ✨ Introducing AI Content Engine 2.0
                        </span>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                            Transform ideas into <br className="hidden sm:inline" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
                                high-performing content
                            </span>
                        </h1>
                        <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                            The ultimate workspace to write scripts, manage projects, and automate your entire social workflow. Built for creators who mean business.
                        </p>
                        <div className="flex flex-col gap-4 sm:flex-row w-full justify-center">
                            <Button size="lg" className="h-12 px-8 text-base shadow-lg" asChild>
                                <Link href="/signup">
                                    Start for free <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                                <Link href="/demo">Book a Demo</Link>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">No credit card required • 14-day free trial</p>
                    </div>
                </div>
            </section>

            {/* 2. Product Preview */}
            <section className="w-full pb-20 md:pb-32 container mx-auto px-4 relative z-10">
                <div className="mx-auto max-w-6xl rounded-xl border border-border/50 bg-background/50 p-2 md:p-4 shadow-2xl backdrop-blur-sm">
                    <div className="overflow-hidden rounded-lg border border-border bg-muted/30 shadow-inner ring-1 ring-white/10">
                        {/* Mock Dashboard Header */}
                        <div className="flex h-12 items-center border-b border-border bg-card px-4">
                            <div className="flex space-x-2">
                                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                            </div>
                        </div>
                        {/* Mock Dashboard Body */}
                        <div className="aspect-video w-full bg-card/80 p-8">
                            <div className="flex h-full gap-8">
                                <div className="w-1/4 h-full hidden md:flex flex-col gap-4">
                                    <div className="h-8 w-full bg-muted rounded-md animate-pulse" />
                                    <div className="h-8 w-3/4 bg-muted rounded-md animate-pulse" />
                                    <div className="h-8 w-5/6 bg-muted rounded-md animate-pulse" />
                                </div>
                                <div className="flex-1 flex flex-col gap-6">
                                    <div className="h-12 w-1/3 bg-muted rounded-md animate-pulse" />
                                    <div className="h-full w-full bg-muted/50 rounded-xl border border-border/50 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Features Section */}
            <section id="features" className="w-full py-20 bg-muted/40">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="mx-auto max-w-[800px] text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            Everything you need to scale
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Powerful tools designed to eliminate friction and boost your creative output.
                        </p>
                    </div>

                    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { title: "Lightning Fast Editor", icon: Zap, desc: "Write without distractions using our markdown-first, ultra-responsive editor." },
                            { title: "Smart Analytics", icon: BarChart2, desc: "Track performance across all platforms from a single, unified dashboard." },
                            { title: "Kanban Project Management", icon: Layout, desc: "Organize videos, scripts, and posts with intuitive drag-and-drop boards." },
                            { title: "Enterprise Security", icon: Shield, desc: "Bank-level encryption and SSO support to keep your IP fully protected." },
                            { title: "Automated Workflows", icon: ArrowRight, desc: "Set triggers to auto-publish content when approvals are met." },
                            { title: "Version Control", icon: CheckCircle2, desc: "Never lose a draft. Every keystroke is saved with full history rollback." }
                        ].map((feature, i) => (
                            <div key={i} className="flex flex-col p-6 bg-card rounded-xl border shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold">{feature.title}</h3>
                                <p className="mt-2 text-muted-foreground">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Benefits Section */}
            <section id="benefits" className="w-full py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid max-w-6xl mx-auto gap-16 lg:grid-cols-2 lg:gap-24 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Stop juggling 10 different apps</h2>
                            <p className="text-lg text-muted-foreground">
                                The modern creator stack is broken. Moving from Notion to Google Docs to Trello wastes time and breaks your flow state.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Consolidate your entire stack into one platform",
                                    "Save up to 15 hours per week on context switching",
                                    "Collaborate with your team in real-time",
                                    "Publish faster with AI-assisted drafting"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                        <span className="text-foreground/90 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="aspect-square rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/5 to-background border shadow-2xl overflow-hidden relative">
                            {/* Decorative Abstract UI element */}
                            <div className="absolute inset-4 rounded-xl border bg-card/50 backdrop-blur-xl p-6 shadow-sm flex flex-col gap-4">
                                <div className="h-1/2 w-full rounded-lg bg-muted/60 animate-pulse" />
                                <div className="h-1/4 w-3/4 rounded-lg bg-muted/60 animate-pulse" />
                                <div className="h-1/4 w-1/2 rounded-lg bg-muted/60 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Pricing Preview */}
            <section id="pricing" className="w-full py-24 bg-muted/30 border-t">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
                    <p className="mt-4 text-lg text-muted-foreground mb-16">Start for free, upgrade when you need more power.</p>

                    <div className="mx-auto grid max-w-4xl grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Free Tier */}
                        <div className="flex flex-col p-8 bg-card rounded-2xl border shadow-sm text-left">
                            <h3 className="text-2xl font-bold">Starter</h3>
                            <p className="text-muted-foreground mt-2">Perfect for solo creators.</p>
                            <div className="my-6">
                                <span className="text-5xl font-extrabold">$0</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Up to 3 projects</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Basic editor</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Community support</li>
                            </ul>
                            <Button className="w-full" variant="outline">Start Free</Button>
                        </div>

                        {/* Pro Tier */}
                        <div className="flex flex-col p-8 bg-primary text-primary-foreground rounded-2xl border shadow-xl text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-white/20 px-4 py-1 rounded-bl-xl text-sm font-semibold">Most Popular</div>
                            <h3 className="text-2xl font-bold">Pro</h3>
                            <p className="text-primary-foreground/80 mt-2">For serious creators and teams.</p>
                            <div className="my-6">
                                <span className="text-5xl font-extrabold">$29</span>
                                <span className="text-primary-foreground/80">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-white" /> Unlimited projects</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-white" /> AI Writing Assistant</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-white" /> Up to 5 team members</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-white" /> Priority support</li>
                            </ul>
                            <Button className="w-full bg-background text-primary hover:bg-background/90">Upgrade to Pro</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Final CTA */}
            <section className="w-full py-32 bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 pattern-dots" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl font-bold tracking-tight mb-6">Ready to scale your content engine?</h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">Join thousands of creators who are already shipping faster and better.</p>
                    <Button size="lg" className="h-14 px-10 text-lg shadow-xl" asChild>
                        <Link href="/signup">Get Started for Free</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
