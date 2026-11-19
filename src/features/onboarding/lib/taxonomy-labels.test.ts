import { describe, expect, it } from 'vitest';

import arOnboarding from '../../../../messages/ar/onboarding.json';
import enOnboarding from '../../../../messages/en/onboarding.json';
import { localizeOptions, localizeTaxonomyLabel, type OnboardingTranslator } from './taxonomy-labels';

/**
 * AR-029 — the backend taxonomy is the source of truth; this module is only a
 * TRANSLATION OVERLAY. These tests pin the two halves of that contract:
 *
 *   - `/en` never consults the catalog — the label the API sent renders
 *     verbatim, which is the regression floor and the no-drift rule;
 *   - `/ar` translates a KNOWN value, but an unknown/new backend value falls
 *     back to the API label, so the backend can grow without a frontend deploy.
 */
function flatten(value: unknown, prefix = ''): Record<string, string> {
    const out: Record<string, string> = {};
    if (typeof value !== 'object' || value === null) return { [prefix]: String(value) };
    for (const [key, child] of Object.entries(value)) {
        if (prefix === '' && key.startsWith('@')) continue;
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

/** A minimal stand-in for next-intl's translator, built from the real catalog. */
function translator(catalog: object): OnboardingTranslator {
    const flat = flatten(catalog);
    const t = ((key: string, values?: Record<string, string | number>) => {
        const template = flat[key];
        if (template === undefined) return key;
        return template.replace(/\{(\w+)\}/g, (_, name: string) =>
            String(values?.[name] ?? `{${name}}`)
        );
    }) as OnboardingTranslator;
    Object.defineProperty(t, 'has', { value: (key: string) => key in flat });
    return t;
}

const en = translator(enOnboarding);
const ar = translator(arOnboarding);

describe('localizeTaxonomyLabel', () => {
    it('English renders the backend label verbatim — it never reads the catalog', () => {
        // Even a value the catalog knows: the API's word wins on /en.
        expect(localizeTaxonomyLabel('en', en, 'niches', 'tech', 'Tech & Software')).toBe(
            'Tech & Software'
        );
        // And a label that differs from the catalog is passed through untouched.
        expect(localizeTaxonomyLabel('en', en, 'niches', 'tech', 'Backend Renamed It')).toBe(
            'Backend Renamed It'
        );
    });

    it('Arabic translates a known backend value from the catalog', () => {
        expect(localizeTaxonomyLabel('ar', ar, 'niches', 'tech', 'Tech & Software')).toBe(
            'التقنية والبرمجيات'
        );
        expect(localizeTaxonomyLabel('ar', ar, 'subtopics', 'Web development', 'Web development')).toBe(
            'تطوير الويب'
        );
        expect(localizeTaxonomyLabel('ar', ar, 'experience', 'beginner', 'Just starting out')).toBe(
            'أبدأ للتو'
        );
        // The backend goal value is a slug with an underscore; the map handles it.
        expect(localizeTaxonomyLabel('ar', ar, 'goals', 'grow_audience', 'Grow my audience')).toBe(
            'تنمية جمهوري'
        );
        expect(localizeTaxonomyLabel('ar', ar, 'steps', 'review', 'Review your choices')).toBe(
            'راجع اختياراتك'
        );
    });

    it('an unknown/new backend value falls back to the backend label', () => {
        expect(localizeTaxonomyLabel('ar', ar, 'niches', 'space-farming', 'Space Farming')).toBe(
            'Space Farming'
        );
        expect(localizeTaxonomyLabel('ar', ar, 'subtopics', 'AI averaged', 'AI averaged')).toBe(
            'AI averaged'
        );
        expect(localizeTaxonomyLabel('en', en, 'goals', 'new_goal', 'Brand new goal')).toBe(
            'Brand new goal'
        );
    });

    it('localizeOptions localizes only the label, never the value', () => {
        const options = [
            { value: 'youtube', label: 'YouTube' },
            { value: 'tiktok', label: 'TikTok' },
            { value: 'brand-new', label: 'Brand New' },
        ];

        expect(localizeOptions('en', en, 'platforms', options)).toEqual(options);
        expect(localizeOptions('ar', ar, 'platforms', options)).toEqual([
            { value: 'youtube', label: 'YouTube' },
            { value: 'tiktok', label: 'TikTok' },
            { value: 'brand-new', label: 'Brand New' },
        ]);
        expect(
            localizeOptions('ar', ar, 'niches', [
                { value: 'tech', label: 'Tech & Software' },
                { value: 'space-farming', label: 'Space Farming' },
            ])
        ).toEqual([
            { value: 'tech', label: 'التقنية والبرمجيات' },
            { value: 'space-farming', label: 'Space Farming' },
        ]);
    });
});
