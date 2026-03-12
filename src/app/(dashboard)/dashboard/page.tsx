import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight,
    FileText,
    Play,
    Plus,
    TrendingUp,
    Zap,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal,
    Users
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div className="space-y-10">
            {/* Hero / Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Workspace Overview
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Welcome back! Here's the latest performance of your content.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-11 px-5 rounded-xl border-border/60 hover:bg-muted group">
                        <Play className="w-4 h-4 mr-2 text-primary transition-transform group-hover:scale-110" />
                        Quick Tutorial
                    </Button>
                    <Button className="h-11 px-6 rounded-xl bg-primary hover:shadow-glow transition-all active:scale-[0.98]">
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                </div>
            </div>

            {/* Metric Cards - Premium Style */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Projects', value: '12', trend: '+2 this month', icon: FileText, color: 'text-blue-500' },
                    { label: 'Scripts Generated', value: '34', trend: '+14% growth', icon: Zap, color: 'text-amber-500' },
                    { label: 'Avg. Viral Score', value: '87', sub: '/ 100', trend: 'Top 15%', icon: TrendingUp, color: 'text-emerald-500', highlighted: true },
                    { label: 'Active Tasks', value: '5', trend: '2 pending review', icon: Clock, color: 'text-purple-500' },
                ].map((item, i) => (
                    <Card key={i} className={item.highlighted ? "relative overflow-hidden border-primary/20 bg-primary/5 shadow-glow" : "bg-card border-border/50 group hover:border-primary/30 transition-colors"}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</CardTitle>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold">{item.value}</span>
                                {item.sub && <span className="text-sm text-muted-foreground font-medium">{item.sub}</span>}
                            </div>
                            <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
                                <span className={item.highlighted ? "text-primary" : "text-emerald-500"}>↑</span>
                                {item.trend}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Recent Projects Table-like List */}
                <Card className="lg:col-span-8 bg-card border-border/50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                        <CardTitle className="text-xl">Recent Projects</CardTitle>
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">View All</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {[
                                { title: 'Viral Hook Optimization', date: '2 hours ago', status: 'Completed', type: 'Script' },
                                { title: 'Global Tech Trends 2026', date: '5 hours ago', status: 'In Progress', type: 'Analysis' },
                                { title: 'Thumbnail Concept Iteration', date: 'Yesterday', status: 'Review', type: 'Design' },
                            ].map((project, i) => (
                                <div key={i} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            {project.type === 'Script' ? <FileText className="w-5 h-5" /> : project.type === 'Analysis' ? <TrendingUp className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{project.title}</h4>
                                            <p className="text-xs text-muted-foreground">{project.type} • {project.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'secondary' : 'warning'}>
                                            {project.status}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions & Utilities */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-card border-border/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { title: 'Generate Script', sub: 'AI Content Engine', icon: Zap, color: 'bg-primary/10 text-primary' },
                                { title: 'Analyze Trends', sub: 'Global Intelligence', icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-500' },
                                { title: 'Team Meeting', sub: 'Schedule Workspace', icon: Users, color: 'bg-purple-500/10 text-purple-500' },
                            ].map((action, i) => (
                                <div key={i} className="flex items-center p-4 rounded-2xl border border-border/50 hover:border-primary/30 hover:bg-muted/50 cursor-pointer transition-all group">
                                    <div className={`${action.color} p-2.5 rounded-xl mr-4 group-hover:scale-110 transition-transform`}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">{action.title}</h4>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground opacity-70">{action.sub}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* System Status / Health */}
                    <Card className="bg-card border-border/50 overflow-hidden">
                        <div className="bg-emerald-500/10 p-5 flex items-center gap-4">
                            <div className="p-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <div>
                                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">All Systems Operational</h4>
                                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">API Latency: 42ms</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
