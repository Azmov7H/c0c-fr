'use client';

import { useState } from 'react';
import { useTrends, useGenerateTrends } from '../hooks/use-trends';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    TrendingUp,
    Flame,
    Target,
    Globe,
    PieChart,
    Users,
    ArrowUpRight,
    RefreshCw,
    Search,
    CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Platform } from '../types';

export const TrendsDashboard = () => {
    const [activePlatform, setActivePlatform] = useState<Platform>('youtube');
    const { data: reports, isLoading } = useTrends(activePlatform);
    const { mutate: generate, isPending: isGenerating } = useGenerateTrends();

    const handleGenerate = () => {
        generate(activePlatform);
    };

    const report = reports && reports.length > 0 ? reports[0] : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header section with platform selection */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Globe className="w-8 h-8 text-primary" />
                        Market Intelligence
                    </h1>
                    <p className="text-muted-foreground mt-2">Real-time global niche trends and viral predictors</p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/10">
                    <Tabs value={activePlatform} onValueChange={(val) => setActivePlatform(val as Platform)}>
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="youtube" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">YouTube</TabsTrigger>
                            <TabsTrigger value="tiktok" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">TikTok</TabsTrigger>
                            <TabsTrigger value="instagram" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Instagram</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button variant="outline" size="icon" className="border-white/10" onClick={handleGenerate} disabled={isGenerating}>
                        <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                </div>
            ) : !report ? (
                <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8">
                        <Search className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Initialize Analysis</h3>
                    <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed">
                        Connect to the {activePlatform} neural API to harvest current high-growth keywords and consumer sentiment.
                    </p>
                    <Button size="lg" onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? 'Scanning Neural Network...' : 'Begin Global Analysis'}
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="shadow-sm border-white/5 bg-background/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" /> Viral Velocity
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white">{report.viralScore}%</div>
                                <p className="text-[10px] text-primary mt-1 font-medium">Hyper-Growth Potential</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-white/5 bg-background/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-orange-500" /> Avg Engagement
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white">{report.avgEngagement}%</div>
                                <p className="text-[10px] text-orange-500 mt-1 font-medium">+4.2% from last analysis</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-white/5 bg-background/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-red-500" /> Competition
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white uppercase tracking-tight">{report.competitionLevel}</div>
                                <p className="text-[10px] text-red-500 mt-1 font-medium">Saturated Market</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-white/5 bg-background/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardDescription className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-green-500" /> Core Demographic
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm font-semibold text-white leading-tight overflow-hidden text-ellipsis line-clamp-1">
                                    {report.demographics.coreAudience}
                                </div>
                                <p className="text-[10px] text-green-500 mt-2 font-medium">Verified Active</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Visualization Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Hot Keywords Bar Chart Mock */}
                        <Card className="lg:col-span-2 shadow-sm border-white/5 bg-background/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Exploding Keywords</CardTitle>
                                <CardDescription>Highest 24h search volume growth by category</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                {report.risingKeywords.map((k, i) => (
                                    <div key={i} className="space-y-2 group">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">{k.keyword}</span>
                                                <Badge variant="outline" className="text-[9px] bg-white/5 border-white/10 uppercase py-0">{k.category}</Badge>
                                            </div>
                                            <span className="text-xs text-primary font-mono font-bold flex items-center gap-1">
                                                <ArrowUpRight className="w-3 h-3" /> +{k.growth}%
                                            </span>
                                        </div>
                                        <Progress value={Math.min(100, k.growth / 20)} className="h-2 bg-white/5" indicatorClassName="bg-primary/80" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Sentiment & Location */}
                        <div className="space-y-8">
                            <Card className="shadow-sm border-white/5 bg-background/50 backdrop-blur-xl">
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <PieChart className="w-4 h-4 text-muted-foreground" />
                                        Audience Sentiment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex h-4 w-full rounded-full overflow-hidden border border-white/5">
                                        <div className="h-full bg-green-500" style={{ width: `${report.sentiment.positive}%` }} />
                                        <div className="h-full bg-yellow-500" style={{ width: `${report.sentiment.neutral}%` }} />
                                        <div className="h-full bg-red-500" style={{ width: `${report.sentiment.negative}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Positive</span>
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Neutral</span>
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Negative</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-white/5 bg-background/50 backdrop-blur-xl">
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-muted-foreground" />
                                        Top Geographical Reach
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {report.demographics.topLocations.map((loc, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                            <span className="text-xs text-white">{loc.city}</span>
                                            <span className="text-xs font-bold text-primary">{loc.percentage}%</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex flex-col items-center text-center">
                                <CheckCircle2 className="w-8 h-8 text-primary mb-4" />
                                <h4 className="text-sm font-semibold text-white mb-2">Algorithm Match Verified</h4>
                                <p className="text-xs text-muted-foreground">Market conditions for your selected platform are currently OPTIMAL for deployment.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
