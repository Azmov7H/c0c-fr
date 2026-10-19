import { z } from 'zod';
import { Platform } from '@/types';
import type { OnboardingOptions } from '../services/onboarding.service';
import type { OnboardingDraft } from './onboarding-draft';

/**
 * Client-side mirrors of T04's validation (onboarding.validation.ts).
 *
 * The numeric and uniqueness constraints are mirrored exactly here — a parity
 * test pins them. Taxonomy membership (is this a real niche/subtopic/goal?)
 * cannot be mirrored in a schema without hardcoding the taxonomy, which the
 * card forbids; it is checked at runtime against `GET /users/onboarding/options`
 * in `validateStepAnswer`, and the server stays authoritative.
 */

export const ONBOARDING_LIMITS = {
    minSubtopics: 3,
    maxSubtopics: 8,
    maxInterests: 12,
    maxPlatforms: 3,
} as const;

export const STEP_KEYS = ['niche', 'subtopics', 'platforms', 'experience', 'goals', 'review'] as const;
export const REVIEW_STEP = 5;

/** The final indicator label is "Finish", not "Step 6" (card §4). */
export const FINISH_LABEL = 'Finish';

const isUnique = (values: readonly string[]): boolean => new Set(values).size === values.length;
const topicField = z.string().trim().min(2).max(60);

export const nicheFieldSchema = topicField;

export const subtopicsFieldSchema = z
    .array(topicField)
    .min(ONBOARDING_LIMITS.minSubtopics)
    .max(ONBOARDING_LIMITS.maxSubtopics)
    .refine(isUnique, { message: 'Pick each subtopic once.' });

export const platformsFieldSchema = z
    .array(z.enum(['youtube', 'tiktok', 'instagram']))
    .min(1)
    .max(ONBOARDING_LIMITS.maxPlatforms)
    .refine(isUnique, { message: 'Pick each platform once.' });

export const experienceFieldSchema = z.string().trim().min(2).max(60);

export const goalsFieldSchema = z
    .array(topicField)
    .min(1)
    .refine(isUnique, { message: 'Pick each goal once.' });

/** The niche's own subtopics when a niche is chosen, else the whole taxonomy. */
export function subtopicsFor(
    options: OnboardingOptions,
    niche: string | null
): { value: string; label: string }[] {
    if (niche) {
        const match = options.niches.find((entry) => entry.slug === niche);
        if (match) return match.subtopics.map((value) => ({ value, label: value }));
    }
    const all = new Set<string>();
    for (const entry of options.niches) for (const topic of entry.subtopics) all.add(topic);
    return [...all].map((value) => ({ value, label: value }));
}

/**
 * The visible reason a step cannot advance, or null when it can.
 *
 * Returning the reason (not just a boolean) is the point: the card requires a
 * visible explanation, never a silently disabled button.
 */
export function validateStepAnswer(
    step: number,
    draft: OnboardingDraft,
    options: OnboardingOptions
): string | null {
    switch (step) {
        case 0: {
            const parsed = nicheFieldSchema.safeParse(draft.niche ?? '');
            if (!parsed.success) return 'Choose one niche to continue.';
            if (!options.niches.some((entry) => entry.slug === draft.niche)) {
                return 'Choose one of the listed niches.';
            }
            return null;
        }
        case 1: {
            const parsed = subtopicsFieldSchema.safeParse(draft.subtopics);
            if (!parsed.success) {
                return `Choose between ${ONBOARDING_LIMITS.minSubtopics} and ${ONBOARDING_LIMITS.maxSubtopics} subtopics.`;
            }
            const known = new Set(subtopicsFor(options, null).map((entry) => entry.value));
            if (!draft.subtopics.every((topic) => known.has(topic))) {
                return 'Every subtopic must come from the list.';
            }
            return null;
        }
        case 2: {
            const parsed = platformsFieldSchema.safeParse(draft.platforms);
            if (!parsed.success) return 'Choose between 1 and 3 platforms.';
            return null;
        }
        case 3: {
            const parsed = experienceFieldSchema.safeParse(draft.experience ?? '');
            if (!parsed.success) return 'Pick your experience level.';
            if (!options.experienceLevels.some((entry) => entry.value === draft.experience)) {
                return 'Pick one of the listed experience levels.';
            }
            return null;
        }
        case 4: {
            const parsed = goalsFieldSchema.safeParse(draft.goals);
            if (!parsed.success) return 'Pick at least one goal.';
            const known = new Set(options.goals.map((entry) => entry.value));
            if (!draft.goals.every((goal) => known.has(goal))) {
                return 'Every goal must come from the list.';
            }
            return null;
        }
        default:
            return null;
    }
}

/** Reasons the Complete action is unavailable, in user-facing words. */
export function missingForCompletion(
    draft: OnboardingDraft,
    options: OnboardingOptions
): string[] {
    const missing: string[] = [];
    if (validateStepAnswer(0, draft, options)) missing.push('a niche');
    if (validateStepAnswer(1, draft, options)) {
        missing.push(`${ONBOARDING_LIMITS.minSubtopics}–${ONBOARDING_LIMITS.maxSubtopics} subtopics`);
    }
    if (validateStepAnswer(2, draft, options)) missing.push('at least one platform');
    if (validateStepAnswer(3, draft, options)) missing.push('your experience level');
    if (validateStepAnswer(4, draft, options)) missing.push('at least one goal');
    return missing;
}

/** Client mirror of T04's `saveOnboardingStepSchema` body (strict, 1+ field). */
export const saveStepBodySchema = z
    .object({
        niche: nicheFieldSchema.optional(),
        subtopics: subtopicsFieldSchema.optional(),
        platforms: platformsFieldSchema.optional(),
        experience: experienceFieldSchema.optional(),
        goals: goalsFieldSchema.optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, { message: 'provide at least one field' });

export type SaveStepBody = z.infer<typeof saveStepBodySchema>;

/** Re-exported so tests can assert the union without importing services. */
export type OnboardingPlatform = Platform;
