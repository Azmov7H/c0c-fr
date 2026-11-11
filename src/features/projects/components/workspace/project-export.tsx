'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, PackageOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { toApiError } from '@/lib/api-error';
import {
    exportService,
    formatBytes,
    type ExportEstimate,
    type ExportRecordView,
    type ExportScope,
} from '../../services/export.service';

type Scope = ExportScope;
const SCOPES: Array<{ value: Scope; label: string }> = [
    { value: 'full', label: 'Complete (all)' },
    { value: 'script', label: 'Script' },
    { value: 'images', label: 'Images' },
    { value: 'audio', label: 'Audio' },
    { value: 'media', label: 'Media + script' },
];

const newIdempotencyKey = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `export-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Why the export is refused, in the user's words (never a raw code). */
function blockedMessage(estimate: ExportEstimate | undefined): string | null {
    if (!estimate) return null;
    if (estimate.blockedReason === 'allowance_reached') {
        const limit = estimate.allowance.limit ?? 1;
        return `You have used your ${limit} free export${limit === 1 ? '' : 's'} for this project.`;
    }
    if (estimate.blockedReason === 'pricing_pending') {
        return 'Paid exports open once the export price is published. Your free export is unaffected.';
    }
    if (estimate.nothingToExport) {
        return 'There is nothing to export yet — generate a script or some assets first.';
    }
    return null;
}

function statusBadge(record: ExportRecordView) {
    if (record.status === 'completed') {
        return <Badge variant="success">Completed</Badge>;
    }
    if (record.status === 'failed') {
        return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">In progress</Badge>;
}

function failureNote(record: ExportRecordView): string | null {
    if (record.status !== 'failed') return null;
    if (record.reason === 'cancelled') return 'Cancelled — nothing was charged.';
    if (record.reason === 'allowance_reached') return 'Refused — the free export was already used.';
    return 'Nothing was charged.';
}

/**
 * M2-T25 — ZIP export affordance. Fetches the streaming ZIP via the BFF
 * (authenticated, blob), triggers the download, and surfaces the manifest
 * summary (README.txt lives inside the archive; missing files are listed
 * from the response headers only when the backend provides them).
 *
 * P09.8 — before the button: the server's estimate (bytes, credits, what is
 * left of the Free allowance) and the reason an export is refused. Below
 * it: the export history, so a failed or cancelled export is visible and
 * never silently paid for.
 */
export function ProjectExport({ projectId, title }: { projectId: string; title: string }) {
    const [scope, setScope] = React.useState<Scope>('full');
    const [pending, setPending] = React.useState(false);
    const [idempotencyKey, setIdempotencyKey] = React.useState(newIdempotencyKey);
    const queryClient = useQueryClient();

    const estimateQuery = useQuery({
        queryKey: ['export', 'estimate', projectId, scope],
        queryFn: () => exportService.estimate(projectId, scope),
        enabled: Boolean(projectId),
        staleTime: 15_000,
    });

    const historyQuery = useQuery({
        queryKey: ['export', 'history', projectId],
        queryFn: () => exportService.history(projectId),
        enabled: Boolean(projectId),
        staleTime: 15_000,
    });

    const estimate = estimateQuery.data;
    const blocked = blockedMessage(estimate);
    const canExport = Boolean(estimate?.canExport) && !pending;

    const onExport = async () => {
        setPending(true);
        try {
            const blob = await exportService.download(projectId, scope, idempotencyKey);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `c0c-${title.replace(/[^\w-]+/g, '-').slice(0, 40) || 'project'}-${date}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            // A new key for the NEXT export: this one is spent.
            setIdempotencyKey(newIdempotencyKey());
            toast.success('Export downloaded');
            void queryClient.invalidateQueries({ queryKey: ['export'] });
        } catch (error) {
            const apiError = toApiError(error, 'Export failed. Check that assets exist and retry.');
            if (apiError.code === 'EXPORT_ALLOWANCE_REACHED') {
                toast.error('You have used your free export for this project.');
            } else if (apiError.code === 'PRICING_PENDING') {
                toast.error('Paid exports open once the export price is published.');
            } else if (apiError.status === 402) {
                toast.error(apiError.message);
            } else if (apiError.code === 'NOTHING_TO_EXPORT') {
                toast.error('There is nothing to export yet.');
            } else {
                toast.error(apiError.message);
            }
            void queryClient.invalidateQueries({ queryKey: ['export'] });
        } finally {
            setPending(false);
        }
    };

    const records = historyQuery.data?.records ?? [];

    return (
        <div className="space-y-3" aria-label="Export project">
            <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="export-scope" className="sr-only">
                    Export scope
                </Label>
                <select
                    id="export-scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value as Scope)}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                >
                    {SCOPES.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <Button size="sm" className="h-11" disabled={!canExport} onClick={onExport}>
                    {pending ? (
                        <Loader2 className="mr-1 size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <PackageOpen className="mr-1 size-4" aria-hidden="true" />
                    )}
                    {pending ? 'Preparing…' : 'Export'}
                </Button>
                {pending && (
                    <span role="status" className="text-xs text-muted-foreground">
                        Preparing export…
                    </span>
                )}
            </div>

            {/* The server's numbers, before the button — never a client estimate. */}
            {estimateQuery.isLoading ? (
                <Skeleton className="h-4 w-56 rounded" />
            ) : estimate ? (
                <p className="text-xs text-muted-foreground">
                    {formatBytes(estimate.estimateBytes)}
                    {estimate.pricePending
                        ? ' · cost pending'
                        : estimate.creditCost > 0
                          ? ` · ${estimate.creditCost} credits`
                          : ''}
                    {estimate.allowance.remaining !== null
                        ? ` · ${estimate.allowance.remaining} of ${estimate.allowance.limit} free export${
                              (estimate.allowance.limit ?? 1) === 1 ? '' : 's'
                          } left`
                        : ''}
                </p>
            ) : null}

            {blocked ? (
                <p className="text-xs font-medium text-warning" role="status">
                    {blocked}
                </p>
            ) : null}

            {records.length > 0 ? (
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Export history
                    </h3>
                    <ul className="mt-2 space-y-1">
                        {records.map((record) => (
                            <li
                                key={record.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                                <span className="text-muted-foreground">
                                    {new Date(record.startedAt).toLocaleDateString()} ·{' '}
                                    {record.scope}
                                </span>
                                <span className="flex items-center gap-2">
                                    {failureNote(record) ? (
                                        <span className="text-muted-foreground">
                                            {failureNote(record)}
                                        </span>
                                    ) : null}
                                    {record.creditCost > 0 ? (
                                        <span className="tabular-nums">
                                            {record.creditCost} credits
                                        </span>
                                    ) : null}
                                    {statusBadge(record)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
