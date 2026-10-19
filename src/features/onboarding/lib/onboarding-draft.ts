import { Platform } from '@/types';
import type { OnboardingOptions, OnboardingState, SaveStepInput } from '../services/onboarding.service';
import { ONBOARDING_LIMITS, REVIEW_STEP } from './onboarding-schemas';

/**
 * The wizard's working copy of the answers, plus the pure functions that turn
 * one step into a `PUT` body and fold a server response back into state.
 *
 * Keeping these pure is what makes optimistic update, rollback and resume
 * testable without a component.
 */

export interface OnboardingDraft {
    niche: string | null;
    subtopics: string[];
    platforms: Platform[];
    experience: string | null;
    goals: string[];
}

export const emptyDraft: OnboardingDraft = {
    niche: null,
    subtopics: [],
    platforms: [],
    experience: null,
    goals: [],
};

/**
 * Rebuild the draft from server state.
 *
 * T04 stores the niche only as `interests[0]` — there is no separate field — so
 * once subtopics are saved (which replaces `interests`), the niche has to be
 * inferred from the subtopics. The UI only ever offers a niche's own subtopics,
 * so the inference is exact in the real flow; it is a documented deviation of
 * T04's model, not of this card.
 */
export function draftFromState(state: OnboardingState, options?: OnboardingOptions): OnboardingDraft {
    const knownNiches = new Set((options?.niches ?? []).map((entry) => entry.slug));
    const knownSubtopics = new Set(
        (options?.niches ?? []).flatMap((entry) => entry.subtopics)
    );

    const topics = (state.interests ?? []).map((entry) => entry.topic);
    const subtopics = knownSubtopics.size > 0
        ? topics.filter((topic) => knownSubtopics.has(topic))
        : topics.filter((topic) => topic !== state.niche);

    let niche = state.niche;
    if (niche && knownNiches.size > 0 && !knownNiches.has(niche)) {
        // `state.niche` is actually a subtopic (that is how T04 derives it).
        niche = inferNiche(subtopics, options);
    }
    if (!niche && subtopics.length > 0) {
        niche = inferNiche(subtopics, options);
    }

    return {
        niche: niche ?? null,
        subtopics,
        platforms: (state.preferredPlatforms ?? []) as Platform[],
        experience: state.experience ?? null,
        goals: state.goals ?? [],
    };
}

function inferNiche(subtopics: string[], options?: OnboardingOptions): string | null {
    if (!options) return null;
    let best: { slug: string; score: number } | null = null;
    for (const entry of options.niches) {
        const score = entry.subtopics.filter((topic) => subtopics.includes(topic)).length;
        if (score > 0 && (!best || score > best.score)) best = { slug: entry.slug, score };
    }
    return best?.slug ?? null;
}

/** The `PUT` body for advancing out of `step`, or null for the review step. */
export function stepInput(step: number, draft: OnboardingDraft): SaveStepInput | null {
    switch (step) {
        case 0:
            return draft.niche ? { niche: draft.niche } : null;
        case 1:
            return { subtopics: draft.subtopics };
        case 2:
            return { platforms: draft.platforms };
        case 3:
            return draft.experience ? { experience: draft.experience } : null;
        case 4:
            return { goals: draft.goals };
        default:
            return null;
    }
}

/**
 * Whether two step bodies carry the same answer.
 *
 * The wizard uses this to skip a redundant `PUT` when the user pages back and
 * forward without changing anything: T04's `saveStep` rewrites
 * `onboardingStep`, so re-saving an earlier step would make a later reload
 * resume too early even though nothing changed.
 */
export function sameStepInput(a: SaveStepInput, b: SaveStepInput): boolean {
    const normalize = (input: SaveStepInput) =>
        JSON.stringify({
            niche: input.niche ?? null,
            subtopics: input.subtopics ?? null,
            platforms: input.platforms ?? null,
            experience: input.experience ?? null,
            goals: input.goals ?? null,
        });
    return normalize(a) === normalize(b);
}

/**
 * Optimistic fold of a step body into cached state — mirrors
 * onboarding.service.ts `saveStep` so the UI does not flicker between the
 * optimistic value and the refetched one.
 */
export function applyStepToState(state: OnboardingState, input: SaveStepInput): OnboardingState {
    const next: OnboardingState = { ...state };

    if (input.niche) {
        next.interests = [{ topic: input.niche, weight: 1 }];
        next.onboardingStep = 1;
    }

    if (input.subtopics) {
        const chosen = input.subtopics.map((topic) => ({ topic, weight: 1 }));
        const existing = (state.interests ?? []).filter(
            (entry) => !input.subtopics!.includes(entry.topic)
        );
        const merged = [...chosen, ...existing].slice(0, ONBOARDING_LIMITS.maxInterests);
        next.interests = merged;
        next.niche = merged[0]?.topic ?? null;
        next.onboardingStep = 2;
    }

    if (input.platforms) {
        next.preferredPlatforms = input.platforms;
        next.onboardingStep = 3;
    }

    if (input.experience) {
        next.experience = input.experience;
        next.onboardingStep = 4;
    }

    if (input.goals) {
        next.goals = input.goals;
        next.onboardingStep = 5;
    }

    return next;
}

/** Where to resume: the server's step, clamped into the step range. */
export function resumeStep(state: OnboardingState | undefined): number {
    if (!state) return 0;
    return Math.min(Math.max(state.onboardingStep ?? 0, 0), REVIEW_STEP);
}
