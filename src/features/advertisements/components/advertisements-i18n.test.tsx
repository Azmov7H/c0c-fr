// @vitest-environment jsdom
/**
 * The advertisement surface is bilingual and the preview is a sandboxed
 * document. These tests mount the real components with the Arabic catalog so a
 * component that kept English copy — or widened the iframe sandbox — fails.
 */
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render as rtlRender, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';

import arAdvertisements from '../../../../messages/ar/advertisements.json';
import { LanguageGate } from './language-gate';
import { PreviewPlayer } from './preview-player';

vi.mock('next/navigation', () => ({
    usePathname: () => '/ar/advertisements',
}));

const renderArabic = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return rtlRender(ui, {
        wrapper: ({ children }: { children?: React.ReactNode }) => (
            <NextIntlClientProvider locale="ar" messages={{ advertisements: arAdvertisements }}>
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </NextIntlClientProvider>
        ),
    });
};

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('advertisement components in Arabic', () => {
    it('renders the confirmed language sentence from the catalog', () => {
        renderArabic(
            <LanguageGate
                id="ad-1"
                language="ar"
                confidence={0.92}
                confirmed
                canEdit={false}
            />
        );

        expect(screen.getByText(/^تم الاكتشاف: العربية \(/)).toBeVisible();
    });

    it('renders an unconfirmed gate with translated controls', () => {
        renderArabic(
            <LanguageGate
                id="ad-1"
                language="ar"
                confidence={0.42}
                confirmed={false}
                canEdit
            />
        );

        expect(screen.getByText('تأكيد لغة المحتوى')).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'لغة الإعلان' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'تأكيد اللغة' })).toBeVisible();
    });

    it('accepts only the documented sandbox token and preserves the RTL document', () => {
        renderArabic(
            <PreviewPlayer
                preview={{
                    html: '<!doctype html><html lang="ar" dir="rtl"><body>مرحبا</body></html>',
                    durationSec: 30,
                    sandbox: 'allow-scripts',
                }}
            />
        );

        const iframe = screen.getByTitle('المعاينة') as HTMLIFrameElement;
        expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
        expect(iframe.getAttribute('srcdoc')).toContain('dir="rtl"');
        expect(iframe.getAttribute('srcdoc')).toContain('lang="ar"');
    });

    it('rejects a widened sandbox value from the server', () => {
        renderArabic(
            <PreviewPlayer
                preview={{
                    html: '<!doctype html><html lang="ar" dir="rtl"><body>مرحبا</body></html>',
                    durationSec: 30,
                    sandbox: 'allow-same-origin allow-scripts',
                }}
            />
        );

        const iframe = screen.getByTitle('المعاينة') as HTMLIFrameElement;
        expect(iframe.getAttribute('sandbox')).not.toContain('allow-scripts');
        expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin');
    });

    it('uses the translated fallback when there is no composition yet', () => {
        renderArabic(<PreviewPlayer />);

        expect(screen.getByText('المعاينة غير متاحة حتى يتم توليد تركيب.')).toBeVisible();
    });
});
