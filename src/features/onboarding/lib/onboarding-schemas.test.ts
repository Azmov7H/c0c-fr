import { describe, expect, it } from 'vitest';

import {
    ONBOARDING_LIMITS,
    missingForCompletion,
    platformsFieldSchema,
    goalsFieldSchema,
    nicheFieldSchema,
    subtopicsFieldSchema,
    subtopicsFor,
    validateStepAnswer,
} from './onboarding-schemas';
import { emptyDraft, type OnboardingDraft } from './onboarding-draft';
import { testOptions } from './test-fixtures';

const draft = (patch: Partial<OnboardingDraft>): OnboardingDraft => ({ ...emptyDraft, ...patch });

describe('client/server constraint parity (T04 ↔ T13)', () => {
    it('mirrors the constraints the API advertises', () => {
        expect(ONBOARDING_LIMITS.minSubtopics).toBe(testOptions.constraints.minSubtopics);
        expect(ONBOARDING_LIMITS.maxSubtopics).toBe(testOptions.constraints.maxSubtopics);
        expect(ONBOARDING_LIMITS.maxInterests).toBe(testOptions.constraints.maxInterests);
        expect(ONBOARDING_LIMITS.maxPlatforms).toBe(testOptions.constraints.maxPlatforms);
    });

    it('accepts exactly min..max subtopics and rejects either side', () => {
        expect(
            subtopicsFieldSchema.safeParse(['Alpha one', 'Alpha two', 'Alpha three']).success
        ).toBe(true);
        expect(subtopicsFieldSchema.safeParse(['Alpha one', 'Alpha two']).success).toBe(false);
        expect(
            subtopicsFieldSchema.safeParse(
                Array.from({ length: 9 }, (_, index) => `Topic ${index}`)
            ).success
        ).toBe(false);
        expect(
            subtopicsFieldSchema.safeParse(['Alpha one', 'Alpha two', 'Alpha three', 'Alpha one'])
                .success
        ).toBe(false);
    });

    it('requires 1..3 unique platforms', () => {
        expect(platformsFieldSchema.safeParse([]).success).toBe(false);
        expect(platformsFieldSchema.safeParse(['youtube']).success).toBe(true);
        expect(platformsFieldSchema.safeParse(['youtube', 'youtube']).success).toBe(false);
        expect(
            platformsFieldSchema.safeParse(['youtube', 'tiktok', 'instagram', 'youtube']).success
        ).toBe(false);
    });

    it('requires at least one goal and rejects duplicates', () => {
        expect(goalsFieldSchema.safeParse([]).success).toBe(false);
        expect(goalsFieldSchema.safeParse(['goal_one']).success).toBe(true);
        expect(goalsFieldSchema.safeParse(['goal_one', 'goal_one']).success).toBe(false);
    });

    it('applies the T04 topic length bounds', () => {
        expect(nicheFieldSchema.safeParse('a').success).toBe(false);
        expect(nicheFieldSchema.safeParse('ab').success).toBe(true);
        expect(nicheFieldSchema.safeParse('x'.repeat(61)).success).toBe(false);
    });
});

describe('validateStepAnswer — visible reasons, never a silent block', () => {
    it('step 0 needs a niche from the API list', () => {
        expect(validateStepAnswer(0, draft({ niche: 'alpha' }), testOptions)).toBeNull();
        expect(validateStepAnswer(0, draft({ niche: null }), testOptions)).toMatch(/niche/i);
        expect(validateStepAnswer(0, draft({ niche: 'not-a-niche' }), testOptions)).toMatch(
            /listed niches/i
        );
    });

    it('step 1 needs the minimum subtopics and they must be known', () => {
        expect(
            validateStepAnswer(1, draft({ subtopics: ['Alpha one', 'Beta one', 'Beta two'] }), testOptions)
        ).toBeNull();
        expect(validateStepAnswer(1, draft({ subtopics: ['Alpha one'] }), testOptions)).toMatch(
            /3 and 8/
        );
        expect(
            validateStepAnswer(
                1,
                draft({ subtopics: ['Alpha one', 'Beta one', 'Not real'] }),
                testOptions
            )
        ).toMatch(/from the list/i);
    });

    it('step 2 needs at least one platform', () => {
        expect(validateStepAnswer(2, draft({ platforms: ['youtube'] }), testOptions)).toBeNull();
        expect(validateStepAnswer(2, draft({ platforms: [] }), testOptions)).toMatch(/platform/i);
    });

    it('step 3 needs a known experience level', () => {
        expect(validateStepAnswer(3, draft({ experience: 'starter' }), testOptions)).toBeNull();
        expect(validateStepAnswer(3, draft({ experience: 'wizard' }), testOptions)).toMatch(
            /listed experience/i
        );
    });

    it('step 4 needs known goals', () => {
        expect(validateStepAnswer(4, draft({ goals: ['goal_one'] }), testOptions)).toBeNull();
        expect(validateStepAnswer(4, draft({ goals: [] }), testOptions)).toMatch(/at least one goal/i);
        expect(validateStepAnswer(4, draft({ goals: ['be_famous'] }), testOptions)).toMatch(
            /from the list/i
        );
    });
});

describe('subtopicsFor', () => {
    it('narrows to the chosen niche', () => {
        const values = subtopicsFor(testOptions, 'beta').map((entry) => entry.value);
        expect(values).toEqual(['Beta one', 'Beta two', 'Beta three', 'Beta four']);
    });

    it('falls back to the whole taxonomy when no niche is chosen', () => {
        expect(subtopicsFor(testOptions, null)).toHaveLength(8);
    });
});

describe('missingForCompletion', () => {
    it('lists every unmet requirement in user words', () => {
        expect(missingForCompletion(emptyDraft, testOptions)).toEqual([
            'a niche',
            '3–8 subtopics',
            'at least one platform',
            'your experience level',
            'at least one goal',
        ]);
    });

    it('is empty when everything required is chosen', () => {
        const ready = draft({
            niche: 'alpha',
            subtopics: ['Alpha one', 'Alpha two', 'Alpha three'],
            platforms: ['youtube'],
            experience: 'starter',
            goals: ['goal_one'],
        });
        expect(missingForCompletion(ready, testOptions)).toEqual([]);
    });
});
