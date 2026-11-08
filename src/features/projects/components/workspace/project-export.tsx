'use client';

import { useState } from 'react';
import { Loader2, PackageOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { toApiError } from '@/lib/api-error';
import apiClient from '@/services/api-client';

type Scope = 'full' | 'script' | 'images' | 'audio' | 'media';
const SCOPES: Array<{ value: Scope; label: string }> = [
    { value: 'full', label: 'Complete (all)' },
    { value: 'script', label: 'Script' },
    { value: 'images', label: 'Images' },
    { value: 'audio', label: 'Audio' },
    { value: 'media', label: 'Media + script' },
];

/**
 * M2-T25 — ZIP export affordance. Fetches the streaming ZIP via the BFF
 * (authenticated, blob), triggers the download, and surfaces the manifest
 * summary (README.txt lives inside the archive; missing files are listed
 * from the response headers only when the backend provides them).
 */
export function ProjectExport({ projectId, title }: { projectId: string; title: string }) {
    const [scope, setScope] = useState<Scope>('full');
    const [pending, setPending] = useState(false);

    const exportQuery = useQuery({
        queryKey: ['export', projectId, scope],
        queryFn: async () => {
            const res = await apiClient.get(`/projects/${projectId}/export`, {
                params: { scope },
                responseType: 'blob',
            });
            return res;
        },
        enabled: false,
    });

    const onExport = async () => {
        setPending(true);
        try {
            const res = await exportQuery.refetch();
            if (res.error) throw res.error;
            const blob = res.data?.data as unknown as Blob;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `c0c-${title.replace(/[^\w-]+/g, '-').slice(0, 40) || 'project'}-${date}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Export downloaded');
        } catch (error) {
            const apiError = toApiError(error, 'Export failed. Check that assets exist and retry.');
            toast.error(apiError.message);
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2" aria-label="Export project">
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
            <Button size="sm" className="h-11" disabled={pending || !projectId} onClick={onExport}>
                {pending ? <Loader2 className="mr-1 size-4 animate-spin" aria-hidden="true" /> : <PackageOpen className="mr-1 size-4" aria-hidden="true" />}
                {pending ? 'Preparing…' : 'Export'}
            </Button>
            {pending && <span role="status" className="text-xs text-muted-foreground">Preparing export…</span>}
        </div>
    );
}
