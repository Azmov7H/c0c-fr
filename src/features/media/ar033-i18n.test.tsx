/**
 * @vitest-environment jsdom
 */
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ApiError } from '@/lib/api-error';

import arAudio from '../../../messages/ar/audio.json';
import enAudio from '../../../messages/en/audio.json';
import arThumbnails from '../../../messages/ar/thumbnails.json';
import enThumbnails from '../../../messages/en/thumbnails.json';
import arMedia from '../../../messages/ar/media.json';
import enMedia from '../../../messages/en/media.json';
import arBilling from '../../../messages/ar/billing.json';
import enBilling from '../../../messages/en/billing.json';

import { AudioStudio } from '@/features/audio/components/audio-studio';
import { ThumbnailStudio } from '@/features/thumbnails/components/thumbnail-studio';
import { MediaLibrary } from '@/features/media/components/media-library';
import { UnsplashAttribution } from '@/features/images/components/unsplash-attribution';

const mocks = vi.hoisted(() => ({
    projects: [] as Array<{ _id: string; title: string }>,
    audio: [] as unknown[],
    media: { data: [] as unknown[] },
    generateSoundMail: vi.fn(),
}));

vi.mock('@/features/projects/hooks/use-projects', () => ({
    useProjects: () => ({ data: { data: mocks.projects }, isLoading: false }),
}));

vi.mock('@/features/audio/hooks/use-audio', () => ({
    useProjectAudio: () => ({ data: mocks.audio, isLoading: false }),
    useGenerateAudio: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
    useUploadAudio: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useReplaceAudioFile: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useUploadAudioFile: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useGenerateSoundMail: () => ({
        mutate: mocks.generateSoundMail,
        mutateAsync: vi.fn(),
        isPending: false,
    }),
}));

vi.mock('@/features/media/hooks/use-media', () => ({
    useProjectMedia: () => ({ data: mocks.media, isLoading: false }),
}));

vi.mock('@/features/billing/hooks/use-billing', () => ({
    useBillingSummary: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/features/billing/components/upgrade-prompt', () => ({
    UpgradePrompt: ({ title, ctaLabel }: { title?: string; ctaLabel?: string }) => (
        <div>{title}{ctaLabel}</div>
    ),
}));

vi.mock('@/i18n/navigation', () => ({
    Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string }) => <a href={href} {...props}>{children}</a>,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => '/ar/thumbnails',
}));

const MESSAGES = {
    en: { audio: enAudio, thumbnails: enThumbnails, media: enMedia, billing: enBilling },
    ar: { audio: arAudio, thumbnails: arThumbnails, media: arMedia, billing: arBilling },
} as const;

function renderAr(ui: ReactElement) {
    return render(
        <NextIntlClientProvider locale="ar" messages={MESSAGES.ar}>
            {ui}
        </NextIntlClientProvider>
    );
}

beforeEach(() => {
    mocks.projects = [];
    mocks.audio = [];
    mocks.media = { data: [] };
    mocks.generateSoundMail.mockReset();
});

afterEach(() => {
    cleanup();
});

describe('AR-033 audio/thumbnails/media i18n', () => {
    it('audio studio renders Arabic chrome and keeps transport LTR', () => {
        mocks.projects = [{ _id: 'p1', title: 'مشروع' }];
        mocks.audio = [
            {
                id: 'a1',
                _id: 'a1',
                projectId: 'p1',
                fileUrl: 'https://example.com/a.mp3',
                source: 'generated',
                isCurrent: true,
                mood: 'energetic',
                status: 'completed',
                tracks: [],
                sfxSuggestions: [],
            },
        ];
        const { container } = renderAr(<AudioStudio />);
        expect(screen.getByText('المؤثرات الصوتية')).toBeTruthy();
        expect(screen.getByText('البنية الصوتية')).toBeTruthy();
        expect(screen.getByText('الملفات الصوتية')).toBeTruthy();
        expect(screen.getByRole('button', { name: /توليد ملف صوتي/ })).toBeTruthy();
        expect(screen.getByText('الصوت الحالي')).toBeTruthy();
        const audio = container.querySelector('audio[controls]');
        expect(audio?.getAttribute('dir')).toBe('ltr');
    });

    it('surfaces the D8 gate for generated Sound Mail in Arabic', () => {
        mocks.projects = [{ _id: 'p1', title: 'مشروع' }];
        mocks.generateSoundMail.mockImplementation(
            (
                _data: unknown,
                options?: { onError?: (error: unknown) => void }
            ) => {
                options?.onError?.(
                    new ApiError({ code: 'AI_VOICE_GATED', message: 'AI voice disabled' })
                );
            }
        );

        renderAr(<AudioStudio />);
        fireEvent.click(screen.getByRole('button', { name: /توليد رسالة صوتية/ }));

        expect(
            screen
                .getAllByRole('alert')
                .some((node) => node.textContent?.includes('AI_VOICE_GATED'))
        ).toBe(true);
        expect(mocks.generateSoundMail).toHaveBeenCalledWith(
            expect.objectContaining({ projectId: 'p1' }),
            expect.anything()
        );
    });

    it('thumbnail studio renders Arabic chrome', () => {
        renderAr(<ThumbnailStudio />);
        expect(screen.getByText('استوديو الصور المصغّرة')).toBeTruthy();
        expect(screen.getByText('النواة البصرية')).toBeTruthy();
        expect(screen.getByRole('button', { name: /توليد صورة مصغّرة/ })).toBeTruthy();
        expect(screen.getByText('لا توجد صورة مصغّرة بعد')).toBeTruthy();
    });

    it('media library renders Arabic chrome', () => {
        renderAr(<MediaLibrary />);
        expect(screen.getByText('مكتبة الوسائط')).toBeTruthy();
        expect(screen.getByText('رفع')).toBeTruthy();
        expect(screen.getByPlaceholderText('ابحث في الأصول...')).toBeTruthy();
        expect(screen.getByText('لا توجد وسائط بعد')).toBeTruthy();
    });

    it('unsplash attribution localizes connectors but keeps brand/name links', () => {
        renderAr(
            <UnsplashAttribution
                photo={{
                    source: 'unsplash',
                    photoId: '1',
                    imageUrl: 'https://images.unsplash.com/1',
                    photographerName: 'Alice',
                    photographerUsername: 'alice',
                    photographerProfileUrl: 'https://unsplash.com/@alice',
                    photoPageUrl: 'https://unsplash.com/photos/1',
                }}
            />
        );
        expect(screen.getByText(/الصورة بواسطة/)).toBeTruthy();
        expect(screen.getByText(/على/)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Alice' })).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Unsplash' })).toBeTruthy();
    });
});
