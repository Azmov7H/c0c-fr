// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type {
    ExportEstimate,
    ExportRecordView,
} from '@/features/projects/services/export.service';
import { ProjectExport } from './project-export';

const mocks = vi.hoisted(() => ({
    estimate: vi.fn(),
    history: vi.fn(),
    download: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
}));

vi.mock('@/features/projects/services/export.service', async () => {
    const actual = await vi.importActual<
        typeof import('@/features/projects/services/export.service')
    >('@/features/projects/services/export.service');
    return {
        ...actual,
        exportService: {
            estimate: (projectId: string, scope: string) => mocks.estimate(projectId, scope),
            history: (projectId: string) => mocks.history(projectId),
            download: (projectId: string, scope: string, key: string) =>
                mocks.download(projectId, scope, key),
        },
    };
});

vi.mock('@/lib/toast', () => ({
    toast: { success: (...args: unknown[]) => mocks.toastSuccess(...args), error: (...args: unknown[]) => mocks.toastError(...args) },
}));

const estimate = (overrides: Partial<ExportEstimate> = {}): ExportEstimate => ({
    scope: 'full',
    estimateBytes: 4_096,
    creditCost: 0,
    pricePending: false,
    plan: 'starter',
    capBytes: 107_374_182,
    nothingToExport: false,
    allowance: { used: 0, limit: 1, remaining: 1 },
    canExport: true,
    blockedReason: null,
    ...overrides,
});

const record = (overrides: Partial<ExportRecordView> = {}): ExportRecordView => ({
    id: 'record-1',
    scope: 'full',
    status: 'completed',
    creditCost: 0,
    estimateBytes: 4_096,
    startedAt: '2026-11-05T09:00:00.000Z',
    completedAt: '2026-11-05T09:00:01.000Z',
    reason: null,
    manifestHash: 'abc123',
    ...overrides,
});

function renderExport() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <ProjectExport projectId="project-1" title="My Project" />
        </QueryClientProvider>
    );
}

beforeEach(() => {
    mocks.estimate.mockResolvedValue(estimate());
    mocks.history.mockResolvedValue({ records: [], meta: { page: 1, limit: 10, total: 0 } });
    mocks.download.mockResolvedValue(new Blob(['PK']));
    vi.stubGlobal('URL', {
        ...URL,
        createObjectURL: () => 'blob:mock',
        revokeObjectURL: () => undefined,
    });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

describe('project export', () => {
    it('shows the server estimate before the download button', async () => {
        renderExport();

        expect(await screen.findByText(/4 KB/)).toBeTruthy();
        expect(await screen.findByText(/1 of 1 free export left/)).toBeTruthy();
        expect(screen.getByRole('button', { name: /export/i })).toBeEnabled();
    });

    it('disables the export and explains when the free allowance is spent', async () => {
        mocks.estimate.mockResolvedValue(
            estimate({
                canExport: false,
                blockedReason: 'allowance_reached',
                allowance: { used: 1, limit: 1, remaining: 0 },
            })
        );

        renderExport();

        expect(
            await screen.findByText(/you have used your 1 free export for this project/i)
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
    });

    it('disables the export and explains while the paid price is pending', async () => {
        mocks.estimate.mockResolvedValue(
            estimate({
                plan: 'pro',
                pricePending: true,
                canExport: false,
                blockedReason: 'pricing_pending',
                allowance: { used: 0, limit: null, remaining: null },
            })
        );

        renderExport();

        expect(
            await screen.findByText(/paid exports open once the export price is published/i)
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
    });

    it('lists the export history, including a failed export that cost nothing', async () => {
        mocks.history.mockResolvedValue({
            records: [
                record(),
                record({
                    id: 'record-2',
                    status: 'failed',
                    reason: 'cancelled',
                    startedAt: '2026-11-06T09:00:00.000Z',
                }),
            ],
            meta: { page: 1, limit: 10, total: 2 },
        });

        renderExport();

        expect(await screen.findByText('Export history')).toBeTruthy();
        expect(screen.getByText('Completed')).toBeTruthy();
        expect(screen.getByText('Failed')).toBeTruthy();
        expect(screen.getByText(/cancelled — nothing was charged/i)).toBeTruthy();
    });

    it('surfaces a refused export as a message, not a crash', async () => {
        const { ApiError } = await import('@/lib/api-error');
        mocks.download.mockRejectedValue(
            new ApiError({
                code: 'EXPORT_ALLOWANCE_REACHED',
                message: 'EXPORT_ALLOWANCE_REACHED: this project has used its 1 free export(s).',
                status: 409,
            })
        );

        renderExport();

        // The button stays disabled until the server's estimate arrives.
        expect(await screen.findByText(/4 KB/)).toBeTruthy();
        const button = screen.getByRole('button', { name: /export/i });
        fireEvent.click(button);

        await vi.waitFor(() => {
            expect(mocks.toastError).toHaveBeenCalledWith(
                expect.stringContaining('free export')
            );
        });
    });
});
