import { Badge, type BadgeProps } from '@/components/ui/badge';

/**
 * Semantic status colors (spec §7.2, Admin UI). The variant per status group
 * lives here so lists (users, subscriptions, projects, jobs) render a
 * consistent, permission-free badge. Unknown statuses fall back to the
 * neutral `outline` variant — the roster is not exhaustive; it is shared
 * vocabulary, not an enum on the backend.
 */
const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
    active: 'success',
    healthy: 'success',
    ok: 'success',
    verified: 'success',
    succeeded: 'success',
    complete: 'success',
    completed: 'success',
    published: 'success',
    queued: 'warning',
    pending: 'warning',
    in_progress: 'warning',
    processing: 'warning',
    suspended: 'warning',
    past_due: 'warning',
    failed: 'destructive',
    error: 'destructive',
    failed_generation: 'destructive',
    disabled: 'outline',
    draft: 'secondary',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
    return <Badge variant={STATUS_VARIANTS[status] ?? 'outline'}>{label ?? status}</Badge>;
}
