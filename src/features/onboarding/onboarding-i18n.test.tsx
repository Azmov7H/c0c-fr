// @vitest-environment jsdom
/**
 * AR-029 — the onboarding screens speak Arabic.
 *
 * The copy test proves the catalogs are complete; this one proves the
 * COMPONENTS read them. The real client components are mounted inside an
 * Arabic provider with the URL locale set to `/ar` (as in production), and the
 * Arabic sentences are asserted — the failure mode a catalog test cannot catch
 * is a component that kept an English literal.
 */
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';

import { renderArabic } from './test-utils';
import { NicheStep, PlatformsStep, SubtopicsStep } from './components/step-panels';
import { WizardProgress } from './components/wizard-progress';
import { SkipDialog } from './components/skip-dialog';
import { OnboardingCompletion } from './components/onboarding-completion';
import { emptyDraft } from './lib/onboarding-draft';
import { testOptions } from './lib/test-fixtures';
import type { OnboardingOptions } from './services/onboarding.service';

vi.mock('next/navigation', () => ({
    usePathname: () => '/ar/onboarding',
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => cleanup());

/** Backend-shaped options: real slugs/labels as `GET /users/onboarding/options` sends them. */
const arabicOptions: OnboardingOptions = {
    ...testOptions,
    niches: [
        { slug: 'tech', label: 'Tech & Software', subtopics: ['Web development', 'AI & ML'] },
        { slug: 'space-farming', label: 'Space Farming', subtopics: ['Comet soil'] },
    ],
};

describe('AR-029 the onboarding screens in Arabic', () => {
    it('the niche step speaks Arabic and translates a known backend label', () => {
        renderArabic(
            <NicheStep draft={emptyDraft} options={arabicOptions} onChange={() => {}} />
        );

        expect(screen.getByRole('heading', { name: 'ما الذي تصنع محتوى عنه؟' })).toBeVisible();
        expect(screen.getByText('اختر الأنسب لك.')).toBeVisible();
        expect(screen.getByRole('radio', { name: 'التقنية والبرمجيات' })).toBeVisible();
    });

    it('an unknown/new backend value falls back to the backend label', () => {
        renderArabic(
            <NicheStep draft={emptyDraft} options={arabicOptions} onChange={() => {}} />
        );
        expect(screen.getByRole('radio', { name: 'Space Farming' })).toBeVisible();
    });

    it('a step label from the API is translated through the taxonomy map', () => {
        renderArabic(
            <SubtopicsStep
                draft={{ ...emptyDraft, niche: 'tech' }}
                options={arabicOptions}
                onChange={() => {}}
            />
        );
        expect(screen.getByRole('heading', { name: 'ما الموضوعات الفرعية التي تهمك؟' })).toBeVisible();
        expect(screen.getByText('تطوير الويب')).toBeVisible();
    });

    it('the platform names stay as brands while their step copy is Arabic', () => {
        renderArabic(
            <PlatformsStep draft={emptyDraft} options={arabicOptions} onChange={() => {}} />
        );
        expect(screen.getByRole('heading', { name: 'أين تنشر؟' })).toBeVisible();
        expect(screen.getByRole('checkbox', { name: 'YouTube' })).toBeVisible();
    });

    it('the progress bar and its last stop are Arabic', () => {
        renderArabic(<WizardProgress current={0} total={6} steps={arabicOptions.steps} />);
        expect(screen.getByText('الخطوة 1 من 6')).toBeVisible();
        expect(screen.getAllByText('إنهاء').length).toBeGreaterThan(0);
    });

    it('the skip confirmation is Arabic', () => {
        renderArabic(<SkipDialog onConfirm={() => {}} pending={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'تخطَّ الآن' }));
        expect(screen.getByText('تخطي التخصيص؟')).toBeVisible();
        expect(screen.getByRole('button', { name: 'المتابعة' })).toBeVisible();
    });

    it('the completion screen is Arabic', () => {
        renderArabic(<OnboardingCompletion projectId="p1" />);
        expect(screen.getByText('مشروعك الأول جاهز')).toBeVisible();
        expect(screen.getByRole('link', { name: 'افتح مشروعي الأول' })).toBeVisible();
    });
});
