import { TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Read-only explanation shown where a mutation control is absent (spec §5.2):
 * e.g. "Admin views credits: read-only banner — 'Finance permission required
 * to move credits'". Presentational; the parent passes the message.
 */
export function ReadOnlyBanner({
    message,
    className,
}: {
    message: string;
    className?: string;
}) {
    return (
        <div
            role="status"
            className={cn(
                'flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning',
                className,
            )}
        >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
        </div>
    );
}
