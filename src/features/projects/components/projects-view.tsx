'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Archive, FolderOpen, Plus, SearchX, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataState } from '@/components/shared/data-state';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@/lib/utils';
import type { Platform, ProjectStatus } from '@/types';

import { useProjectView } from '../hooks/use-project-view';
import { useProjects } from '../hooks/use-projects';
import {
    EMPTY_FILTERS,
    filtersToQuery,
    hasProjectFilters,
    parseProjectFilters,
    serializeProjectFilters,
    type ProjectFilters,
} from '../lib/project-filters';
import { PLATFORM_LABEL, STATUS_LABEL } from '../lib/project-constants';
import { ProjectCard } from './project-card';
import { ProjectsSkeleton } from './projects-skeletons';
import { ProjectsTable } from './projects-table';
import { ProjectsToolbar } from './projects-toolbar';

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex h-8 items-center gap-1 rounded-full border border-border/60 bg-muted/40 pl-3 pr-1 text-xs font-medium">
            {label}
            <button
                type="button"
                aria-label={`Remove filter ${label}`}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onRemove}
            >
                <X className="size-3" aria-hidden="true" />
            </button>
        </span>
    );
}

export function ProjectsView() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [view, setView] = useProjectView();

    const rawQuery = searchParams.toString();
    const filters = useMemo(
        () => parseProjectFilters(new URLSearchParams(rawQuery)),
        [rawQuery]
    );

    const updateFilters = useCallback(
        (next: ProjectFilters) => {
            const query = serializeProjectFilters(next);
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        },
        [pathname, router]
    );

    const clearFilters = useCallback(() => {
        updateFilters({ ...EMPTY_FILTERS });
    }, [updateFilters]);

    const apiQuery = useMemo(() => filtersToQuery(filters), [filters]);

    const { data, isLoading, isError, error, refetch } = useProjects(apiQuery);

    const projects = data?.data ?? [];
    const meta = data?.meta;
    const total = meta?.total ?? 0;
    const hasFilters = hasProjectFilters(filters);
    const isArchive = filters.statuses.length === 1 && filters.statuses[0] === 'archived';

    const removeStatus = (status: ProjectStatus) =>
        updateFilters({
            ...filters,
            statuses: filters.statuses.filter((value) => value !== status),
            page: 1,
        });

    const removePlatform = (platform: Platform) =>
        updateFilters({
            ...filters,
            platforms: filters.platforms.filter((value) => value !== platform),
            page: 1,
        });

    const emptyTitle = isArchive
        ? 'No archived projects'
        : hasFilters
          ? 'No projects match these filters'
          : 'No projects yet';

    const emptyDescription = isArchive
        ? 'Archive a project to keep it out of the active list without removing it.'
        : hasFilters
          ? 'Try a different search term, or clear the filters to see everything.'
          : 'Create your first project to start generating AI-powered content.';

    const emptyAction = isArchive
        ? { label: 'Back to projects', onClick: clearFilters }
        : hasFilters
          ? { label: 'Clear filters', onClick: clearFilters }
          : {
                label: 'Create your first project',
                onClick: () => router.push('/projects/new'),
            };

    const grid = (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title={isArchive ? 'Project archive' : 'Projects'}
                description={
                    isArchive
                        ? 'Projects you have archived. Restore one to put it back in the active list.'
                        : 'Your content projects, scripts and workflows in one place.'
                }
                actions={
                    <Button asChild className="h-11 px-4">
                        <Link href="/projects/new">
                            <Plus className="mr-2 size-4" aria-hidden="true" />
                            New Project
                        </Link>
                    </Button>
                }
            />

            <ProjectsToolbar
                filters={filters}
                onChange={updateFilters}
                onClear={clearFilters}
                view={view}
                onViewChange={setView}
                resultCount={isLoading ? undefined : total}
            />

            {hasFilters ? (
                <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
                    {filters.q ? (
                        <FilterChip
                            label={`Search: ${filters.q}`}
                            onRemove={() => updateFilters({ ...filters, q: '', page: 1 })}
                        />
                    ) : null}
                    {filters.statuses.map((status) => (
                        <FilterChip
                            key={status}
                            label={STATUS_LABEL[status]}
                            onRemove={() => removeStatus(status)}
                        />
                    ))}
                    {filters.platforms.map((platform) => (
                        <FilterChip
                            key={platform}
                            label={PLATFORM_LABEL[platform]}
                            onRemove={() => removePlatform(platform)}
                        />
                    ))}
                    <Button
                        type="button"
                        variant="link"
                        className="h-8 px-2 text-xs"
                        onClick={clearFilters}
                    >
                        Clear all
                    </Button>
                </div>
            ) : null}

            <DataState
                isLoading={isLoading}
                error={isError ? error : undefined}
                isEmpty={projects.length === 0}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
                emptyIcon={isArchive ? Archive : hasFilters ? SearchX : FolderOpen}
                emptyAction={emptyAction}
                onRetry={() => void refetch()}
                loadingFallback={<ProjectsSkeleton view={view} />}
            >
                {view === 'table' ? (
                    <>
                        <div className="hidden md:block">
                            <ProjectsTable projects={projects} />
                        </div>
                        <div className="md:hidden">{grid}</div>
                    </>
                ) : (
                    grid
                )}
            </DataState>

            {meta && meta.totalPages > 1 && projects.length > 0 ? (
                <nav
                    aria-label="Project pages"
                    className="flex flex-col items-center justify-between gap-3 sm:flex-row"
                >
                    <p className="text-xs text-muted-foreground">
                        Page {meta.page} of {meta.totalPages} · {total}{' '}
                        {total === 1 ? 'project' : 'projects'}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 min-w-24"
                            disabled={!meta.hasPrevPage}
                            onClick={() =>
                                updateFilters({ ...filters, page: Math.max(1, filters.page - 1) })
                            }
                        >
                            Previous
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 min-w-24"
                            disabled={!meta.hasNextPage}
                            onClick={() => updateFilters({ ...filters, page: filters.page + 1 })}
                        >
                            Next
                        </Button>
                    </div>
                </nav>
            ) : null}

            <p className={cn('sr-only')} aria-live="polite">
                {data ? `${total} projects found` : 'Loading projects'}
            </p>
        </div>
    );
}
