'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * The four states every data-driven page has, in one component.
 *
 * Uxui.md mandates loading, empty, error and success states, but each page had
 * been inventing its own — a spinner here, a bare "No data" there. Encoding the
 * four states once is what makes the mandate real, and it is why no page should
 * render a spinner as its only loading affordance: the loading branch here is a
 * skeleton that mirrors the content's shape.
 *
 * Order matters — loading wins over error wins over empty. A query that is
 * refreshing after an error should show the skeleton, not a stale error banner,
 * and an empty result that is still loading should not flash the empty state.
 */
interface DataStateProps {
    isLoading?: boolean;
    error?: unknown;
    isEmpty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: React.ElementType;
    emptyAction?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        disabled?: boolean;
    };
    /** Number of skeleton rows in the loading branch. Match the content height. */
    skeletonRows?: number;
    /**
     * Shape-specific skeleton. The default branch is a list; a card grid or a
     * metric row passes its own so the loading state mirrors the content instead
     * of jumping when data lands.
     */
    loadingFallback?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

function errorMessage(error: unknown): string | null {
    if (error instanceof Error && error.message) return error.message;
    return null;
}

export function DataState({
    isLoading,
    error,
    isEmpty,
    emptyTitle = 'Nothing here yet',
    emptyDescription = 'There is no data to show for this view.',
    emptyIcon,
    emptyAction,
    skeletonRows = 4,
    loadingFallback,
    className,
    children,
}: DataStateProps) {
    if (isLoading) {
        if (loadingFallback) {
            return (
                <div className={className} data-state="loading">
                    {loadingFallback}
                </div>
            );
        }
        return (
            <div className={cn('space-y-3', className)} data-state="loading">
                {Array.from({ length: skeletonRows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
                <span className="sr-only" role="status">Loading</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={className} data-state="error">
                <Alert variant="destructive">
                    <AlertTriangle />
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription>
                        {errorMessage(error) ??
                            'The data could not be loaded. Try again in a moment.'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className={className} data-state="empty">
                <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={emptyIcon}
                    action={emptyAction}
                    className="min-h-[280px]"
                />
            </div>
        );
    }

    return <div data-state="success">{children}</div>;
}
