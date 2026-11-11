import apiClient from '@/services/api-client';
import type { ApiResponse, PaginatedMeta } from '@/types';

/**
 * P09.8 — the export surface.
 *
 * Everything the UI shows about an export comes from the server: the
 * estimate (bytes + credits + what is left), the block reason, and the
 * history. The client never computes a price or a balance.
 */

export type ExportScope = 'full' | 'script' | 'images' | 'audio' | 'media';

export type ExportBlockedReason = 'allowance_reached' | 'pricing_pending';

export interface ExportAllowance {
    used: number;
    /** `null` = the plan is not counted here (paid plans are priced). */
    limit: number | null;
    remaining: number | null;
}

export interface ExportEstimate {
    scope: ExportScope;
    estimateBytes: number;
    creditCost: number;
    /** The export price is not published yet (Cost Analysis). */
    pricePending: boolean;
    plan: string;
    capBytes: number;
    nothingToExport: boolean;
    allowance: ExportAllowance;
    canExport: boolean;
    blockedReason: ExportBlockedReason | null;
}

export type ExportRecordStatus = 'started' | 'completed' | 'failed';

export interface ExportRecordView {
    id: string;
    scope: ExportScope;
    status: ExportRecordStatus;
    creditCost: number;
    estimateBytes: number;
    startedAt: string;
    completedAt: string | null;
    reason: string | null;
    manifestHash: string;
}

export const exportService = {
    async estimate(projectId: string, scope: ExportScope): Promise<ExportEstimate> {
        const response = await apiClient.get<ApiResponse<ExportEstimate>>(
            `/projects/${projectId}/export/estimate`,
            { params: { scope } }
        );
        return response.data.data;
    },

    async history(
        projectId: string,
        page = 1,
        limit = 10
    ): Promise<{ records: ExportRecordView[]; meta: PaginatedMeta }> {
        const response = await apiClient.get<ApiResponse<ExportRecordView[]> & { meta: PaginatedMeta }>(
            `/projects/${projectId}/export/history`,
            { params: { page, limit } }
        );
        return { records: response.data.data, meta: response.data.meta };
    },

    /** The streamed ZIP. The key makes a retry attach to the same export. */
    async download(projectId: string, scope: ExportScope, idempotencyKey: string): Promise<Blob> {
        const response = await apiClient.get<Blob>(`/projects/${projectId}/export`, {
            params: { scope },
            headers: { 'Idempotency-Key': idempotencyKey },
            responseType: 'blob',
        });
        return response.data;
    },
};

/** Human bytes (the server counts bytes; the client only labels them). */
export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    const rounded = value >= 10 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${rounded} ${units[unit]}`;
}
