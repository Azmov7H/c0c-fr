"use client"

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Search, Plus, FileText, MoreVertical, Youtube, Instagram, PlaySquare, FolderOpen } from 'lucide-react';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsPage() {
    const { data, isLoading } = useProjects();
    const projects = data?.data || [];

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'tiktok': return <PlaySquare className="w-4 h-4 text-cyan-500" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
            case 'processing': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
            case 'archived': return 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20';
            default: return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'; // draft
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground mt-1">Manage your content generation projects.</p>
                </div>
                <Link href="/projects/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search projects..." className="pl-9 bg-card" />
                </div>
                {/* Add filter dropdowns here later */}
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="bg-card">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-4 w-1/3 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full mb-4" />
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <Card className="bg-card border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <FolderOpen className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-xl mb-2">No projects found</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            You haven't created any content projects yet. Start by creating your first project.
                        </p>
                        <Link href="/projects/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Project
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project: any) => (
                        <Link href={`/projects/${project._id}`} key={project._id} className="group">
                            <Card className="bg-card hover:border-primary/50 transition-colors h-full flex flex-col">
                                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                    <div className="space-y-1 pr-2">
                                        <CardTitle className="leading-tight group-hover:text-primary transition-colors">
                                            {project.title}
                                        </CardTitle>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            {getPlatformIcon(project.platform)}
                                            <span className="ml-1.5 capitalize">{project.platform}</span>
                                            <span className="mx-2">•</span>
                                            <span>{format(new Date(project.updatedAt), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 text-muted-foreground">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col justify-between">
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                        {project.idea}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <Badge variant="secondary" className={getStatusColor(project.status)}>
                                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                        </Badge>
                                        <Badge variant="outline" className="capitalize">
                                            {project.tone}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
