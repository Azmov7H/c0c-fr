import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectView } from '../lib/project-filters';

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-border/50">
                    <Skeleton className="aspect-video w-full rounded-none motion-reduce:animate-none" />
                    <div className="space-y-3 p-4">
                        <Skeleton className="h-5 w-2/3 motion-reduce:animate-none" />
                        <Skeleton className="h-4 w-full motion-reduce:animate-none" />
                        <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
                        <div className="flex items-center justify-between pt-2">
                            <Skeleton className="h-6 w-20 rounded-full motion-reduce:animate-none" />
                            <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ProjectsTableSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/60">
            <div className="flex gap-4 border-b border-border/60 bg-muted/30 px-4 py-3">
                {['w-1/3', 'w-24', 'w-24', 'w-28', 'w-8'].map((width, index) => (
                    <Skeleton key={index} className={`h-4 ${width} motion-reduce:animate-none`} />
                ))}
            </div>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 border-b border-border/40 px-4 py-4 last:border-0">
                    <div className="w-1/3 space-y-2">
                        <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
                        <Skeleton className="h-3 w-full motion-reduce:animate-none" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full motion-reduce:animate-none" />
                    <Skeleton className="h-6 w-24 rounded-full motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
                    <Skeleton className="ml-auto size-8 motion-reduce:animate-none" />
                </div>
            ))}
        </div>
    );
}

export function ProjectsSkeleton({ view }: { view: ProjectView }) {
    return view === 'table' ? <ProjectsTableSkeleton /> : <ProjectGridSkeleton />;
}
