'use client';

import { useProjectSEO, useGenerateSEO } from '../hooks/use-seo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Hash,
    Search,
    Sparkles,
    Copy,
    CheckCircle2,
    RefreshCw,
    Layout,
    Type,
    TrendingUp,
    Target,
    Zap,
    Loader2,
    Check
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SEOAnalyzerProps {
    projectId: string;
}

export const SEOAnalyzer = ({ projectId }: SEOAnalyzerProps) => {
    const { data: analysis, isLoading } = useProjectSEO(projectId);
    const { mutate: generateSEO, isPending: isGenerating } = useGenerateSEO();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleGenerate = () => {
        generateSEO(projectId);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('System: Context copied to buffer');
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                <Skeleton className="h-96 w-full rounded-[32px]" />
                <Skeleton className="h-96 w-full rounded-[32px]" />
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center glass border-dashed border-primary/20 rounded-[40px] shadow-premium min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-24 h-24 bg-primary ring-8 ring-primary/10 rounded-[32px] flex items-center justify-center mb-10 shadow-glow animate-bounce-slow">
                    <Search className="w-12 h-12 text-primary-foreground" />
                </div>
                <h3 className="text-3xl font-extrabold text-foreground mb-4">SEO Signal: Offline</h3>
                <p className="text-muted-foreground mb-10 max-w-lg text-lg font-medium leading-relaxed">
                    Your project is missing its algorithmic signature. Let the engine architect optimized metadata for maximum reach.
                </p>
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                    className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg hover:shadow-glow active:scale-[0.98] transition-all group"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            Analyzing Niches...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                            Initialize Growth Engine
                        </>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Title & Description Column */}
            <div className="space-y-8">
                <Card className="glass border-border/50 rounded-[32px] shadow-premium overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-6 border-b border-border/50 px-8">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Target className="w-5 h-5" />
                            </div>
                            High-CTR Variants
                        </CardTitle>
                        <CardDescription className="font-medium">Optimized for algorithmic trigger points and user curiosity</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        {analysis.suggestedTitles.map((title, i) => (
                            <div
                                key={i}
                                className="group relative p-5 rounded-2xl border border-border/50 bg-muted/20 hover:border-primary/40 hover:bg-muted/40 transition-all cursor-pointer shadow-sm hover:shadow-premium"
                                onClick={() => copyToClipboard(title, `title-${i}`)}
                            >
                                <p className="text-base font-bold text-foreground pr-12 leading-relaxed tracking-tight">{title}</p>
                                <div className="absolute top-1/2 -translate-y-1/2 right-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                        copiedId === `title-${i}` ? "bg-green-500/20 text-green-500" : "bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                                    )}>
                                        {copiedId === `title-${i}` ? <Check className="w-5 h-5" /> : <Copy className="w-4 h-4" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="glass border-border/50 rounded-[32px] shadow-premium overflow-hidden flex flex-col">
                    <CardHeader className="bg-muted/30 pb-6 border-b border-border/50 px-8">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Layout className="w-5 h-5" />
                            </div>
                            Narrative Meta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 flex-1 relative">
                        <Textarea
                            value={analysis.description}
                            className="min-h-[220px] glass bg-muted/10 border-border/50 rounded-2xl p-6 text-sm font-medium leading-relaxed resize-none focus-visible:ring-primary/20 pointer-events-none opacity-80"
                            readOnly
                        />
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-glow-sm transition-all hover:scale-[1.02]"
                                onClick={() => copyToClipboard(analysis.description, 'desc')}
                            >
                                {copiedId === 'desc' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {copiedId === 'desc' ? 'Copied' : 'Sync Description'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tags & Performance Column */}
            <div className="space-y-8">
                <Card className="glass border-border/50 rounded-[32px] shadow-premium overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-6 border-b border-border/50 px-8">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            Algorithmic Hooks
                        </CardTitle>
                        <CardDescription className="font-medium">Trending keywords with high-intent semantic weight</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-wrap gap-3">
                            {analysis.hashtags.map((tag, i) => (
                                <Badge
                                    key={i}
                                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:shadow-glow-sm"
                                    onClick={() => copyToClipboard(tag, `tag-${i}`)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-border/50 rounded-[32px] shadow-premium overflow-hidden group/potential">
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-400 to-indigo-600 shadow-glow" />
                    <CardHeader className="bg-muted/10 pt-8 px-8">
                        <CardTitle className="text-xl font-extrabold flex items-center justify-between">
                            Growth Projection
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Zap className="w-4 h-4 fill-current" />
                            </div>
                        </CardTitle>
                        <CardDescription className="font-medium">Estimated visibility score across target platforms</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                        <div className="relative w-48 h-48 mb-8 group-hover/potential:scale-105 transition-transform duration-700">
                            <svg className="w-full h-full filter drop-shadow-glow-sm" viewBox="0 0 100 100">
                                <circle
                                    className="text-muted/10 stroke-current"
                                    strokeWidth="6"
                                    fill="transparent"
                                    r="44" cx="50" cy="50"
                                />
                                <circle
                                    className="text-primary stroke-current transition-all duration-1500 ease-out"
                                    strokeWidth="8"
                                    strokeDasharray={`${analysis.platformScore * 2.76}, 276.4`}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r="44" cx="50" cy="50"
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-black text-foreground tracking-tighter">{analysis.platformScore}</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Points</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-2xl font-black text-foreground tracking-tight underline decoration-primary decoration-4 underline-offset-8">"SUPREME CANDIDATE"</h4>
                            <p className="text-sm text-muted-foreground font-medium max-w-[280px] leading-relaxed mx-auto italic mt-4">
                                Exceptional coherence detected between narrative hooks and exponential trend clusters.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-12 rounded-xl border-border/50 glass hover:bg-muted/50 font-bold text-xs uppercase tracking-[0.2em] transition-all group"
                        onClick={handleGenerate}
                    >
                        <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-700" />
                        Re-Architect Logic
                    </Button>
                </div>
            </div>

        </div>
    );
};
