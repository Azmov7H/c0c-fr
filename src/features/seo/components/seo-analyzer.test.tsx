// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

import enSeo from '../../../../messages/en/seo.json';
import { ApiError } from '@/lib/api-error';
import { SEOAnalyzer } from './seo-analyzer';
import type { SEOAnalysis } from '../types';

const mocks = vi.hoisted(() => ({
    analysis: undefined as SEOAnalysis | undefined,
    isLoading: false,
    error: undefined as unknown,
    refetch: vi.fn(),
}));

vi.mock('../hooks/use-seo', () => ({
    useProjectSEO: () => ({
        data: mocks.analysis,
        isLoading: mocks.isLoading,
        error: mocks.error,
        refetch: mocks.refetch,
    }),
    useGenerateSEO: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const analysis = (platformScore: number): SEOAnalysis => ({
    id: 'seo-1',
    projectId: 'p1',
    userId: 'u1',
    suggestedTitles: ['A real title'],
    description: 'A real description',
    hashtags: ['#real'],
    keywords: ['real'],
    platformScore,
    recommendedTags: ['real'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
});

const renderSeo = (ui: ReactElement) =>
    render(
        <NextIntlClientProvider locale="en" messages={{ seo: enSeo }}>
            {ui}
        </NextIntlClientProvider>
    );

beforeEach(() => {
    mocks.analysis = undefined;
    mocks.isLoading = false;
    mocks.error = undefined;
    mocks.refetch.mockReset();
});

afterEach(() => {
    cleanup();
});

describe('SEO projection truthfulness', () => {
    it('derives the verdict from the provider score, not a fixed claim', () => {
        mocks.analysis = analysis(91);
        renderSeo(<SEOAnalyzer projectId="p1" />);

        expect(screen.getByText('STRONG SIGNAL')).toBeTruthy();
        expect(screen.getByText('91')).toBeTruthy();
        expect(screen.queryByText(/SUPREME CANDIDATE/)).toBeNull();
    });

    it('uses the low verdict for a low provider score', () => {
        mocks.analysis = analysis(42);
        renderSeo(<SEOAnalyzer projectId="p1" />);

        expect(screen.getByText('WEAK SIGNAL')).toBeTruthy();
        expect(screen.queryByText(/STRONG SIGNAL/)).toBeNull();
    });

    it('shows a localized error with a working retry instead of a blank panel', () => {
        mocks.error = new ApiError({ code: 'AI_INVALID_RESPONSE', message: 'Provider rejected payload.' });
        renderSeo(<SEOAnalyzer projectId="p1" />);

        expect(screen.getByText('Analysis unavailable')).toBeTruthy();
        expect(screen.getByText('Provider rejected payload.')).toBeTruthy();
        screen.getByRole('button', { name: 'Retry' }).click();
        expect(mocks.refetch).toHaveBeenCalledTimes(1);
    });
});
