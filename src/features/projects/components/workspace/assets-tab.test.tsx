// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { AssetsTab } from './assets-tab';
import { ApiError } from '@/lib/api-error';

const mocks = vi.hoisted(() => {
    const failed = {
        mutate: vi.fn((_input: unknown, opts?: { onError?: (error: unknown) => void }) => {
            opts?.onError?.(
                new ApiError({
                    code: 'QUOTA_EXHAUSTED',
                    message: 'You have used all 3 generations this month.',
                    status: 429,
                })
            );
        }),
        isPending: false,
    };
    const list = () => ({ data: [], isLoading: false, isError: false });
    return {
        failed,
        useProjectScripts: vi.fn(list),
        useProjectThumbnails: vi.fn(list),
        useProjectAudio: vi.fn(list),
        useProjectSEO: vi.fn(() => ({ data: null, isLoading: false })),
        useProjectMedia: vi.fn(() => ({ data: { data: [], meta: { total: 0 } }, isLoading: false })),
        useGenerateScript: () => failed,
        useGenerateAudio: () => ({ mutate: vi.fn(), isPending: false }),
        useGenerateSEO: () => ({ mutate: vi.fn(), isPending: false }),
    };
});

vi.mock('@/features/scripts/hooks/use-scripts', () => ({
    useProjectScripts: mocks.useProjectScripts,
    useGenerateScript: mocks.useGenerateScript,
}));
vi.mock('@/features/thumbnails/hooks/use-thumbnails', () => ({
    useProjectThumbnails: mocks.useProjectThumbnails,
}));
vi.mock('@/features/audio/hooks/use-audio', () => ({
    useProjectAudio: mocks.useProjectAudio,
    useGenerateAudio: mocks.useGenerateAudio,
}));
vi.mock('@/features/seo/hooks/use-seo', () => ({
    useProjectSEO: mocks.useProjectSEO,
    useGenerateSEO: mocks.useGenerateSEO,
}));
vi.mock('@/features/media/hooks/use-media', () => ({
    useProjectMedia: mocks.useProjectMedia,
}));
vi.mock('@/features/thumbnails/components/thumbnail-generator', () => ({
    ThumbnailGenerator: () => <div>thumbnail generator</div>,
}));

vi.mock('@/features/billing/hooks/use-billing', () => ({
    useBillingSummary: () => ({
        data: {
            usage: [
                {
                    feature: 'ai.generation',
                    used: 3,
                    limit: 3,
                    resetAt: '2026-11-01T00:00:00.000Z',
                },
            ],
            quota: { 'ai.generation': 3 },
        },
    }),
}));

describe('AssetsTab', () => {
    afterEach(() => {
        cleanup();
        mocks.failed.mutate.mockClear();
    });

    it('shows an actionable upgrade prompt when generation returns a 429 quota error', () => {
        render(<AssetsTab projectId="p1" role="editor" />);

        const generate = screen.getAllByRole('button', { name: /^generate$/i })[0]!;
        fireEvent.click(generate);

        expect(screen.getByText('Generation quota reached')).toBeTruthy();
        expect(screen.getByText('You have used all 3 generations this month.')).toBeTruthy();
        expect(screen.getByRole('link', { name: /upgrade for more generations/i }).getAttribute('href')).toBe(
            '/settings/billing'
        );
    });

    it('blocks generation for viewers', () => {
        render(<AssetsTab projectId="p1" role="viewer" />);

        for (const button of screen.getAllByRole('button', { name: /^generate$/i })) {
            expect((button as HTMLButtonElement).disabled).toBe(true);
        }
        expect(screen.getByText(/an editor can generate one/i)).toBeTruthy();
    });
});
