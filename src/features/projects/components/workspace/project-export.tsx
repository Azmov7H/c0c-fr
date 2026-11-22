'use client';

import { useUrlLocale } from '@/i18n/locale';
import { formatDate } from '@/lib/format';
import * as React from 'react';
import { useTranslations } from 'next-intl';
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
import { exportKeys } from '../../hooks/use-export-history';
import {
    exportFailureNote,
    exportScopeLabel,
    exportStatusLabel,
    type WorkspaceTranslator,
} from '../../lib/workspace-labels';

type Scope = ExportScope;
/** Stable wire values — the visible labels come from the catalog. */
const SCOPES: readonly Scope[] = ['full', 'script', 'images', 'audio', 'media'];

const newIdempotencyKey = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `export-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Why the export is refused, in the user's words (never a raw code). */
function blockedMessage(
    estimate: ExportEstimate | undefined,
    t: WorkspaceTranslator
): string | null {
    if (!estimate) return null;
    if (estimate.blockedReason === 'allowance_reached') {
        return t('export.blockedAllowance', { limit: estimate.allowance.limit ?? 1 });
    }
    if (estimate.blockedReason === 'pricing_pending') {
        return t('export.blockedPricing');
    }
    if (estimate.nothingToExport) {
        return t('export.blockedNothing');
    }
    return null;
}

function statusBadge(t: WorkspaceTranslator, record: ExportRecordView) {
    const label = exportStatusLabel(t, record.status);
    if (record.status === 'completed') {
        return <Badge variant="success">{label}</Badge>;
    }
    if (record.status === 'failed') {
        return <Badge variant="destructive">{label}</Badge>;
    }
    return <Badge variant="secondary">{label}</Badge>;
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
    const locale = useUrlLocale();
    const t = useTranslations('workspace');
    const [scope, setScope] = React.useState<Scope>('full');
    const [pending, setPending] = React.useState(false);
    const [idempotencyKey, setIdempotencyKey] = React.useState(newIdempotencyKey);
    const queryClient = useQueryClient();

    const estimateQuery = useQuery({
        queryKey: exportKeys.estimate(projectId, scope),
        queryFn: () => exportService.estimate(projectId, scope),
        enabled: Boolean(projectId),
        staleTime: 15_000,
    });

    const historyQuery = useQuery({
        queryKey: exportKeys.history(projectId),
        queryFn: () => exportService.history(projectId),
        enabled: Boolean(projectId),
        staleTime: 15_000,
    });

    const estimate = estimateQuery.data;
    const blocked = blockedMessage(estimate, t);
    const canExport = Boolean(estimate?.canExport) && !pending;

    const onExport = async () => {
        setPending(true);
        try {
            const blob = await exportService.download(projectId, scope, idempotencyKey);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `c0c-${title.replace(/[^\w-]+/g, '-').slice(0, 40) || t('export.filenameFallback')}-${date}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            // A new key for the NEXT export: this one is spent.
            setIdempotencyKey(newIdempotencyKey());
            toast.success(t('export.toastDownloaded'));
            void queryClient.invalidateQueries({ queryKey: ['export'] });
        } catch (error) {
            const apiError = toApiError(error, t('export.toastFailed'));
            if (apiError.code === 'EXPORT_ALLOWANCE_REACHED') {
                toast.error(t('export.toastAllowance'));
            } else if (apiError.code === 'PRICING_PENDING') {
                toast.error(t('export.toastPricing'));
            } else if (apiError.status === 402) {
                toast.error(apiError.message);
            } else if (apiError.code === 'NOTHING_TO_EXPORT') {
                toast.error(t('export.toastNothing'));
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
        <div className="space-y-3" aria-label={t('export.aria')}>
            <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="export-scope" className="sr-only">
                    {t('export.scopeAria')}
                </Label>
                <select
                    id="export-scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value as Scope)}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                >
                    {SCOPES.map((value) => (
                        <option key={value} value={value}>
                            {exportScopeLabel(t, value)}
                        </option>
                    ))}
                </select>
                <Button size="sm" className="h-11" disabled={!canExport} onClick={onExport}>
                    {pending ? (
                        <Loader2 className="me-1 size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <PackageOpen className="me-1 size-4" aria-hidden="true" />
                    )}
                    {pending ? t('export.preparing') : t('export.export')}
                </Button>
                {pending && (
                    <span role="status" className="text-xs text-muted-foreground">
                        {t('export.preparingStatus')}
                    </span>
                )}
            </div>

            {/* The server's numbers, before the button — never a client estimate. */}
            {estimateQuery.isLoading ? (
                <Skeleton className="h-4 w-56 rounded" />
            ) : estimate ? (
                <p className="text-xs text-muted-foreground">
                    <bdi dir="ltr">{formatBytes(estimate.estimateBytes)}</bdi>
                    {estimate.pricePending
                        ? t('export.costPending')
                        : estimate.creditCost > 0
                          ? t('export.creditCost', { count: estimate.creditCost })
                          : ''}
                    {estimate.allowance.remaining !== null
                        ? t('export.allowanceLeft', {
                              remaining: estimate.allowance.remaining,
                              limit: estimate.allowance.limit ?? 1,
                          })
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
                        {t('export.history')}
                    </h3>
                    <ul className="mt-2 space-y-1">
                        {records.map((record) => (
                            <li
                                key={record.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                                <span className="text-muted-foreground">
                                    <bdi dir="ltr">{formatDate(new Date(record.startedAt), locale, {
                                        month: 'numeric',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}</bdi> ·{' '}
                                    <bdi dir="ltr">{record.scope}</bdi>
                                </span>
                                <span className="flex items-center gap-2">
                                    {exportFailureNote(t, record) ? (
                                        <span className="text-muted-foreground">
                                            {exportFailureNote(t, record)}
                                        </span>
                                    ) : null}
                                    {record.creditCost > 0 ? (
                                        <span className="tabular-nums">
                                            {t('export.historyCredits', { count: record.creditCost })}
                                        </span>
                                    ) : null}
                                    {statusBadge(t, record)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
