'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban } from 'lucide-react';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { DataState } from '@/components/shared/data-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SEOAnalyzer } from './seo-analyzer';

/**
 * The /seo page body (T10): the SEO feature module was complete but had no
 * route — the sidebar entry now leads here. Analysis is per-project, so the
 * page is a project picker around the existing analyzer, and it goes through
 * DataState for all four states.
 */
export function SeoView() {
    const router = useRouter();
    const { data, isLoading, error, refetch } = useProjects({ limit: 50 });
    const projects = data?.data ?? [];
    const [pickedId, setPickedId] = useState<string>();

    // Derived, not synced in an effect: until the user picks, the first
    // project is selected — no cascading render after data lands.
    const projectId = pickedId ?? projects[0]?._id;

    return (
        <DataState
            isLoading={isLoading}
            error={error}
            onRetry={() => refetch()}
            isEmpty={projects.length === 0}
            emptyTitle="No projects to analyze yet"
            emptyDescription="SEO analysis runs against a project — create one, then generate content for it."
            emptyIcon={FolderKanban}
            emptyAction={{
                label: 'Create a project',
                onClick: () => router.push('/projects/new'),
            }}
            loadingFallback={
                <div className="space-y-6">
                    <Skeleton className="h-9 w-64 rounded-lg" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Skeleton className="h-96 w-full rounded-3xl" />
                        <Skeleton className="h-96 w-full rounded-3xl" />
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {projects.length > 1 && (
                    <div className="max-w-sm">
                        <label
                            htmlFor="seo-project"
                            className="mb-1.5 block text-xs font-medium text-muted-foreground"
                        >
                            Project
                        </label>
                        <Select value={projectId} onValueChange={setPickedId}>
                            <SelectTrigger id="seo-project" className="w-full">
                                <SelectValue placeholder="Pick a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem key={project._id} value={project._id}>
                                        {project.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {projectId ? <SEOAnalyzer projectId={projectId} /> : null}
            </div>
        </DataState>
    );
}
