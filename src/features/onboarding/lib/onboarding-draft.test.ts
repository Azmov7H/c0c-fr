import { describe, expect, it } from 'vitest';

import {
    applyStepToState,
    draftFromState,
    emptyDraft,
    resumeStep,
    sameStepInput,
    stepInput,
    type OnboardingDraft,
} from './onboarding-draft';
import { completeState, emptyState, testOptions } from './test-fixtures';

const readyDraft: OnboardingDraft = {
    niche: 'alpha',
    subtopics: ['Alpha one', 'Alpha two', 'Alpha three'],
    platforms: ['youtube', 'tiktok'],
    experience: 'mid',
    goals: ['goal_one', 'goal_two'],
};

describe('stepInput', () => {
    it('maps each step to its own PUT field', () => {
        expect(stepInput(0, readyDraft)).toEqual({ niche: 'alpha' });
        expect(stepInput(1, readyDraft)).toEqual({
            subtopics: ['Alpha one', 'Alpha two', 'Alpha three'],
        });
        expect(stepInput(2, readyDraft)).toEqual({ platforms: ['youtube', 'tiktok'] });
        expect(stepInput(3, readyDraft)).toEqual({ experience: 'mid' });
        expect(stepInput(4, readyDraft)).toEqual({ goals: ['goal_one', 'goal_two'] });
    });

    it('has no PUT body for the review step', () => {
        expect(stepInput(5, readyDraft)).toBeNull();
    });

    it('returns null when the required answer is missing', () => {
        expect(stepInput(0, emptyDraft)).toBeNull();
        expect(stepInput(3, emptyDraft)).toBeNull();
    });
});

describe('applyStepToState (optimistic mirror of T04 saveStep)', () => {
    it('a niche replaces interests and advances to step 1', () => {
        const next = applyStepToState(emptyState, { niche: 'alpha' });
        expect(next.interests).toEqual([{ topic: 'alpha', weight: 1 }]);
        expect(next.onboardingStep).toBe(1);
    });

    it('subtopics replace interests, keep the cap, and advance to step 2', () => {
        const next = applyStepToState(emptyState, {
            subtopics: ['Alpha one', 'Alpha two', 'Alpha three'],
        });
        expect(next.interests.map((entry) => entry.topic)).toEqual([
            'Alpha one',
            'Alpha two',
            'Alpha three',
        ]);
        // T04 derives `niche` from interests[0].
        expect(next.niche).toBe('Alpha one');
        expect(next.onboardingStep).toBe(2);
    });

    it('never exceeds MAX_INTERESTS', () => {
        const many = Array.from({ length: 20 }, (_, index) => `Topic ${index}`);
        const next = applyStepToState(emptyState, { subtopics: many });
        expect(next.interests).toHaveLength(12);
    });

    it('platforms, experience and goals each advance one step', () => {
        expect(applyStepToState(emptyState, { platforms: ['youtube'] }).onboardingStep).toBe(3);
        expect(applyStepToState(emptyState, { experience: 'starter' }).onboardingStep).toBe(4);
        expect(applyStepToState(emptyState, { goals: ['goal_one'] }).onboardingStep).toBe(5);
    });
});

describe('resumeStep', () => {
    it('resumes where the server says the user stopped', () => {
        expect(resumeStep({ ...emptyState, onboardingStep: 2 })).toBe(2);
    });

    it('clamps out-of-range stored values into the wizard range', () => {
        expect(resumeStep({ ...emptyState, onboardingStep: 6 })).toBe(5);
        expect(resumeStep({ ...emptyState, onboardingStep: -3 })).toBe(0);
    });

    it('starts at step 0 with no state', () => {
        expect(resumeStep(undefined)).toBe(0);
    });
});

describe('draftFromState', () => {
    it('is empty for a fresh account', () => {
        expect(draftFromState(emptyState, testOptions)).toEqual(emptyDraft);
    });

    it('reads a niche that is the only interest back', () => {
        const state = {
            ...emptyState,
            onboardingStep: 1,
            niche: 'alpha',
            interests: [{ topic: 'alpha', weight: 1 }],
        };
        expect(draftFromState(state, testOptions).niche).toBe('alpha');
        expect(draftFromState(state, testOptions).subtopics).toEqual([]);
    });

    it('infers the niche from saved subtopics (T04 stores no niche field)', () => {
        const state = {
            ...emptyState,
            onboardingStep: 2,
            niche: 'Alpha one',
            interests: [
                { topic: 'Alpha one', weight: 1 },
                { topic: 'Alpha two', weight: 1 },
                { topic: 'Alpha three', weight: 1 },
            ],
        };
        const draft = draftFromState(state, testOptions);
        expect(draft.niche).toBe('alpha');
        expect(draft.subtopics).toEqual(['Alpha one', 'Alpha two', 'Alpha three']);
    });

    it('restores platforms, experience and goals', () => {
        const draft = draftFromState(completeState, testOptions);
        expect(draft.platforms).toEqual(['youtube']);
        expect(draft.experience).toBe('starter');
        expect(draft.goals).toEqual(['goal_one']);
    });
});

describe('sameStepInput', () => {
    it('treats the same answer as equal regardless of extra absent fields', () => {
        expect(sameStepInput({ niche: 'alpha' }, { niche: 'alpha' })).toBe(true);
        expect(sameStepInput({ platforms: ['youtube', 'tiktok'] }, { platforms: ['tiktok', 'youtube'] })).toBe(false);
        expect(sameStepInput({ goals: ['goal_one'] }, { goals: ['goal_two'] })).toBe(false);
    });

    it('does not confuse a step body with another step', () => {
        expect(sameStepInput({ niche: 'alpha' }, { experience: 'starter' })).toBe(false);
        expect(sameStepInput({ subtopics: ['Alpha one', 'Alpha two', 'Alpha three'] }, { subtopics: ['Alpha one', 'Alpha two', 'Alpha three'] })).toBe(true);
    });
});
