'use client';

import { useProjectAnalytics, useGenerateAnalytics } from '../hooks/use-analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    TrendingUp,
    Target,
    Zap,
    AlertCircle,
    RefreshCw,
    ArrowUpRight,
    PieChart
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface AnalyticsViewProps {
    projectId: string;
}

export const AnalyticsView = ({ projectId }: AnalyticsViewProps) => {
    const { data: reports, isLoading } = useProjectAnalytics(projectId);
    const { mutate: generateReport, isPending: isGenerating } = useGenerateAnalytics();

    const handleGenerate = () => {
        generateReport(projectId);
    };

    const report = reports && reports.length > 0 ? reports[0] : null;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl h-[400px]">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No Analysis Found</h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                    Generate an AI-powered analysis to predict performance and get optimization tips for your content idea.
                </p>
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                >
                    {isGenerating ? (
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Zap className="w-5 h-5 mr-2" />
                    )}
                    {isGenerating ? 'Analyzing Content...' : 'Generate Full Analysis'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Retention Score
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{report.retentionPrediction}%</span>
                            <span className="text-xs text-emerald-500 flex items-center">
                                <ArrowUpRight className="w-3 h-3" /> +12%
                            </span>
                        </div>
                        <Progress value={report.retentionPrediction} className="h-1.5 mt-4" />
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Engagement Prob.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">{report.engagementProbability}%</span>
                            <span className="text-xs text-primary flex items-center">
                                High Potential
                            </span>
                        </div>
                        <Progress value={report.engagementProbability} className="h-1.5 mt-4" />
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-500" />
                            Topic Competition
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold uppercase tracking-tighter">{report.topicCompetition}</span>
                        </div>
                        <div className="mt-4 flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 flex-1 rounded-full ${i <= (report.topicCompetition === 'extreme' ? 4 : report.topicCompetition === 'high' ? 3 : 2)
                                            ? 'bg-amber-500' : 'bg-muted'
                                        }`}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Analysis Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Performance Chart Simulation */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Predicted Performance (First 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 w-full flex items-end gap-2 pt-4">
                            {report.performanceData.map((d, i) => {
                                const height = (d.value / Math.max(...report.performanceData.map(pd => pd.value))) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div
                                            className="w-full bg-primary/20 rounded-t-md relative transition-all duration-500 group-hover:bg-primary/40 border-t border-x border-primary/30"
                                            style={{ height: `${height}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {d.value} views
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono">D{d.day}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Competitor Analysis & Suggestions */}
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-muted-foreground" />
                                Audience Overlap
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {report.competitorVolume.map((c, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{c.topic}</span>
                                        <span className="font-mono">{c.percentage}%</span>
                                    </div>
                                    <Progress value={c.percentage} className="h-1" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-primary" />
                                Optimization Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {report.optimizationSuggestions.map((s, i) => (
                                    <li key={i} className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

            </div>

            <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleGenerate}>
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Update Analysis
                </Button>
            </div>

        </div>
    );
};
