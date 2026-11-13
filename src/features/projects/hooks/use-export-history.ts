import { useQuery } from '@tanstack/react-query';

import { exportService, type ExportRecordView } from '../services/export.service';

export const exportKeys = {
    all: ['export'] as const,
    estimate: (projectId: string, scope: string) =>
        [...exportKeys.all, 'estimate', projectId, scope] as const,
    /**
     * Every scope's estimate for one project — the prefix an asset change
     * invalidates. The export's manifest reads the project's assets, so a
     * new script (or image, or narration) must re-estimate the export.
     */
    estimatesFor: (projectId: string) => [...exportKeys.all, 'estimate', projectId] as const,
    history: (projectId: string) => [...exportKeys.all, 'history', projectId] as const,
};

/** P09.1 — the project's export ledger, newest first (the server's rows). */
export function useExportHistory(projectId: string) {
    return useQuery({
        queryKey: exportKeys.history(projectId),
        queryFn: () => exportService.history(projectId),
        enabled: Boolean(projectId),
        staleTime: 15_000,
    });
}

export type { ExportRecordView };
