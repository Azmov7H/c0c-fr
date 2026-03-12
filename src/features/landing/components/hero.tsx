import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export const Hero = () => {
    return (
        <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="container px-4 mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles className="w-3 h-3" />
                    <span>v1.0 is now live with Neural Audio & SFX</span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight  mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    The Engineering Hub <br className="hidden md:block" />
                    <span className="bg-linear-120 from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent">
                        for AI Multi-Content
                    </span>
                </h1>

                <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    Bridge the gap between vision and reality. The first modular monolith architecture built for high-scale, cinematic AI content generation.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                    <Link href="/register">
                        <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(43,108,238,0.3)]">
                            Build Your First Project
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/10 hover:bg-white/5">
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Watch Showreel
                    </Button>
                </div>

                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto opacity-50">
                    {['Trusted by Agencies', '10k+ Generations', 'Clean Architecture', 'Real-time Analytics'].map(t => (
                        <div key={t} className="flex items-center justify-center gap-2 text-xs font-mono tracking-widest uppercase">
                            <CheckCircle2 className="w-3 h-3 text-primary" /> {t}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
