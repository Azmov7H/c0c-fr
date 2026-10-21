import { Skeleton } from '@/components/ui/skeleton';

export function WorkspaceSkeleton() {
    return (
        <div className="space-y-6" data-state="loading">
            <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-4 h-8 w-2/3 max-w-md" />
                <div className="mt-4 flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="mt-6 h-4 w-48" />
            </div>
            <Skeleton className="h-11 w-80 max-w-full" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <span className="sr-only" role="status">Loading project</span>
        </div>
    );
}
