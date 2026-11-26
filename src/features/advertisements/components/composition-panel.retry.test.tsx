// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import arAdvertisements from '../../../../messages/ar/advertisements.json';
import { detailFixture, compositionFixture } from '../../../../tests/helpers/advertisements';
import { ApiError } from '@/lib/api-error';
import { CompositionPanel } from './composition-panel';

const mocks = vi.hoisted(() => ({
    compositionError: undefined as unknown,
    previewError: undefined as unknown,
    compositionRefetch: vi.fn(),
    previewRefetch: vi.fn(),
}));

vi.mock('../hooks/use-advertisements', () => ({
    useGenerateVideo: () => ({ isPending: false, error: null, mutate: vi.fn() }),
    useRegenerateScene: () => ({ isPending: false, error: null, variables: null, mutate: vi.fn() }),
    useComposition: () => ({
        data: undefined,
        error: mocks.compositionError,
        refetch: mocks.compositionRefetch,
    }),
    useVideoPreview: () => ({
        data: undefined,
        error: mocks.previewError,
        refetch: mocks.previewRefetch,
    }),
}));

vi.mock('./gate-error', () => ({ GateError: () => null }));
vi.mock('@/i18n/locale', () => ({ useUrlLocale: () => 'ar' }));

const renderPanel = (composition = false) =>
    render(
        <NextIntlClientProvider locale="ar" messages={{ advertisements: arAdvertisements }}>
            <CompositionPanel
                detail={detailFixture(composition ? { composition: compositionFixture() } : {})}
                canEdit
            />
        </NextIntlClientProvider>
    );

beforeEach(() => {
    mocks.compositionError = undefined;
    mocks.previewError = undefined;
    mocks.compositionRefetch.mockReset();
    mocks.previewRefetch.mockReset();
});

afterEach(cleanup);

describe('composition and preview load failures', () => {
    it('shows a destructive composition alert with a working retry', () => {
        mocks.compositionError = new ApiError({
            code: 'AI_INVALID_RESPONSE',
            message: 'The provider payload was rejected.',
        });
        renderPanel();

        expect(screen.getByText('The provider payload was rejected.')).toBeTruthy();
        const retry = screen.getAllByRole('button', { name: 'إعادة المحاولة' })[0];
        retry?.click();
        expect(mocks.compositionRefetch).toHaveBeenCalledTimes(1);
    });

    it('shows a destructive preview alert with a working retry', () => {
        mocks.previewError = new ApiError({ code: 'PREVIEW_FAILED', message: 'Preview failed.' });
        renderPanel(true);

        expect(screen.getByText('Preview failed.')).toBeTruthy();
        const retry = screen.getAllByRole('button', { name: 'إعادة المحاولة' })[0];
        retry?.click();
        expect(mocks.previewRefetch).toHaveBeenCalledTimes(1);
    });
});
