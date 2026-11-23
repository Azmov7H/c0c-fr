/**
 * @vitest-environment jsdom
 */
import type { ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import arScripts from '../../../messages/ar/scripts.json';
import enScripts from '../../../messages/en/scripts.json';
import arTitles from '../../../messages/ar/titles.json';
import enTitles from '../../../messages/en/titles.json';
import arHashtags from '../../../messages/ar/hashtags.json';
import enHashtags from '../../../messages/en/hashtags.json';

import { ScriptEditor } from './components/script-editor';
import { ScriptGenerator } from './components/script-generator';
import { TitleGenerator } from '@/features/titles/components/title-generator';
import { HashtagGenerator } from '@/features/hashtags/components/hashtag-generator';
import type { Script } from './types';

const scriptMocks = vi.hoisted(() => ({
    script: undefined as
        | { id: string; projectId: string; sections: Array<Record<string, unknown>>; version: number; wordCount: number; status: string }
        | undefined,
    update: vi.fn(),
    generate: vi.fn(),
}));

vi.mock('./hooks/use-scripts', () => ({
    useScript: () => ({ data: scriptMocks.script, isLoading: false }),
    useUpdateScript: () => ({ mutate: scriptMocks.update, isPending: false }),
    useGenerateScript: () => ({ mutate: scriptMocks.generate, isPending: false }),
}));

const MESSAGES = {
    en: { scripts: enScripts, titles: enTitles, hashtags: enHashtags },
    ar: { scripts: arScripts, titles: arTitles, hashtags: arHashtags },
} as const;

function renderWith(locale: 'en' | 'ar', ui: ReactElement) {
    return render(
        <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
            {ui}
        </NextIntlClientProvider>
    );
}

const scriptFixture = (sections: Array<Record<string, unknown>>) =>
    ({
        id: 's1',
        projectId: 'p1',
        sections,
        version: 2,
        wordCount: 10,
        status: 'completed',
    }) as unknown as Script;

describe('AR-032 scripts/titles/hashtags i18n', () => {
    beforeEach(() => {
        scriptMocks.script = undefined;
        scriptMocks.update.mockReset();
        scriptMocks.generate.mockReset();
    });

    it('script editor renders Arabic chrome and localized scene labels', () => {
        scriptMocks.script = scriptFixture([
            { order: 1, label: 'Hook', content: 'hello', narration: '', visualDirection: '', transition: 'cut', durationSeconds: 5, assetIds: [] },
            { order: 2, label: 'Main Content', content: 'body', narration: '', visualDirection: '', transition: 'fade', durationSeconds: 10, assetIds: [] },
        ]) as never;

        renderWith('ar', <ScriptEditor scriptId="s1" />);

        expect(screen.getByText('مشاهد النص (الإصدار 2)')).toBeTruthy();
        expect(screen.getByText('تحسين بالذكاء الاصطناعي')).toBeTruthy();
        expect(screen.getByText('حفظ النص')).toBeTruthy();
        // Scene labels rendered through map, not raw persisted tokens.
        expect(screen.getByText(/المشهد 1 · الافتتاحية/)).toBeTruthy();
        expect(screen.getByText(/المشهد 2 · المحتوى الرئيسي/)).toBeTruthy();
        expect(screen.queryByText(/Scene 1/)).toBeNull();
        expect(screen.queryByText(/Main Content/)).toBeNull();
        // Field labels
        expect(screen.getAllByLabelText('عنوان المقطع').length).toBe(2);
        expect(screen.getAllByLabelText('نص المقطع').length).toBe(2);
        expect(screen.getAllByLabelText('التعليق الصوتي').length).toBe(2);
        expect(screen.getAllByLabelText('التوجيه البصري').length).toBe(2);
    });

    it('script editor preserves persisted label value on save (AR-032 byte-stable)', async () => {
        scriptMocks.script = scriptFixture([
            { order: 1, label: 'Hook', content: 'h', narration: 'n', visualDirection: '', transition: 'cut', durationSeconds: 5, assetIds: [] },
        ]) as never;

        const { container } = renderWith('ar', <ScriptEditor scriptId="s1" />);
        // Content inputs have dir=auto
        const textareas = container.querySelectorAll('textarea[dir="auto"]');
        expect(textareas.length).toBeGreaterThanOrEqual(3);

        // Edit content (Arabic text) then save — stored label must remain the original persisted token.
        const contentFields = screen.getAllByLabelText('نص المقطع');
        fireEvent.change(contentFields[0]!, { target: { value: 'مرحبا بالعالم' } });
        fireEvent.click(screen.getByText('حفظ النص'));

        await waitFor(() => expect(scriptMocks.update).toHaveBeenCalledTimes(1));
        const payload = scriptMocks.update.mock.calls[0]![0];
        expect(payload.data.sections[0].label).toBe('Hook');
        expect(payload.data.sections[0].content).toBe('مرحبا بالعالم');
    });

    it('script generator renders Arabic chrome', () => {
        renderWith('ar', <ScriptGenerator />);
        expect(screen.getByText('مولّد النصوص')).toBeTruthy();
        expect(screen.getByText('لوحة النص')).toBeTruthy();
        expect(screen.getByText('الناتج المُولّد')).toBeTruthy();
        expect(screen.getByText('توليد النص')).toBeTruthy();
        expect(screen.getByText('لا يوجد نص بعد')).toBeTruthy();
    });

    it('title generator renders Arabic chrome', () => {
        renderWith('ar', <TitleGenerator />);
        expect(screen.getByText('مولّد العناوين')).toBeTruthy();
        expect(screen.getByText('موضوعك')).toBeTruthy();
        expect(screen.getByText('توليد العناوين')).toBeTruthy();
        expect(screen.getByText('لا توجد عناوين بعد')).toBeTruthy();
    });

    it('hashtag generator renders Arabic chrome and LTR chips container', () => {
        renderWith('ar', <HashtagGenerator />);
        expect(screen.getByText('مولّد الوسوم')).toBeTruthy();
        expect(screen.getByText('الإعداد')).toBeTruthy();
        expect(screen.getByText('توليد الوسوم')).toBeTruthy();
        expect(screen.getByText('لا توجد وسوم بعد')).toBeTruthy();
        // Category labels are localized
        expect(screen.getByText('الفئة')).toBeTruthy();
    });
});
