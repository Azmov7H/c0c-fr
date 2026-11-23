import { z } from 'zod';
import { Platform } from '@/types';
import type { OnboardingOptions } from '../services/onboarding.service';
import type { OnboardingDraft } from './onboarding-draft';
import { ONBOARDING_LIMITS } from './onboarding-limits';
import {
    EN_VALIDATION_MESSAGES,
    type OnboardingValidationMessages,
} from './onboarding-validation-messages';

/** AR-029 — the limits live in their own module so the copy can import them. */
export { ONBOARDING_LIMITS } from './onboarding-limits';

/**
 * Client-side mirrors of T04's validation (onboarding.validation.ts).
 *
 * The numeric and uniqueness constraints are mirrored exactly here — a parity
 * test pins them. Taxonomy membership (is this a real niche/subtopic/goal?)
 * cannot be mirrored in a schema without hardcoding the taxonomy, which the
 * card forbids; it is checked at runtime against `GET /users/onboarding/options`
 * in `validateStepAnswer`, and the server stays authoritative.
 */

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
    options: OnboardingOptions,
    messages: OnboardingValidationMessages = EN_VALIDATION_MESSAGES
): string | null {
    switch (step) {
        case 0: {
            const parsed = nicheFieldSchema.safeParse(draft.niche ?? '');
            if (!parsed.success) return messages.chooseOneNiche;
            if (!options.niches.some((entry) => entry.slug === draft.niche)) {
                return messages.chooseListedNiche;
            }
            return null;
        }
        case 1: {
            const parsed = subtopicsFieldSchema.safeParse(draft.subtopics);
            if (!parsed.success) return messages.chooseSubtopics;
            const known = new Set(subtopicsFor(options, null).map((entry) => entry.value));
            if (!draft.subtopics.every((topic) => known.has(topic))) {
                return messages.subtopicFromList;
            }
            return null;
        }
        case 2: {
            const parsed = platformsFieldSchema.safeParse(draft.platforms);
            if (!parsed.success) return messages.choosePlatforms;
            return null;
        }
        case 3: {
            const parsed = experienceFieldSchema.safeParse(draft.experience ?? '');
            if (!parsed.success) return messages.pickExperience;
            if (!options.experienceLevels.some((entry) => entry.value === draft.experience)) {
                return messages.pickListedExperience;
            }
            return null;
        }
        case 4: {
            const parsed = goalsFieldSchema.safeParse(draft.goals);
            if (!parsed.success) return messages.pickAtLeastOneGoal;
            const known = new Set(options.goals.map((entry) => entry.value));
            if (!draft.goals.every((goal) => known.has(goal))) {
                return messages.goalFromList;
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
    options: OnboardingOptions,
    messages: OnboardingValidationMessages = EN_VALIDATION_MESSAGES
): string[] {
    const missing: string[] = [];
    if (validateStepAnswer(0, draft, options, messages)) missing.push(messages.missingNiche);
    if (validateStepAnswer(1, draft, options, messages)) {
        missing.push(messages.missingSubtopics);
    }
    if (validateStepAnswer(2, draft, options, messages)) missing.push(messages.missingPlatform);
    if (validateStepAnswer(3, draft, options, messages)) missing.push(messages.missingExperience);
    if (validateStepAnswer(4, draft, options, messages)) missing.push(messages.missingGoal);
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
