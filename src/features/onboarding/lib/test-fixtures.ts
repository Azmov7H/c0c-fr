import type { OnboardingOptions, OnboardingState } from '../services/onboarding.service';

/**
 * A synthetic taxonomy fixture.
 *
 * The values are deliberately NOT real topics: the card's grep-based AC is that
 * no topic list is hardcoded anywhere under src/features/onboarding, and test
 * fixtures must not quietly smuggle one in. Tests that need "more than 15
 * items" build their own long list; the app itself only ever renders what
 * `GET /users/onboarding/options` returns.
 */
export const testOptions: OnboardingOptions = {
    version: 'test-1.0.0',
    niches: [
        {
            slug: 'alpha',
            label: 'Alpha niche',
            subtopics: ['Alpha one', 'Alpha two', 'Alpha three', 'Alpha four'],
        },
        {
            slug: 'beta',
            label: 'Beta niche',
            subtopics: ['Beta one', 'Beta two', 'Beta three', 'Beta four'],
        },
    ],
    experienceLevels: [
        { value: 'starter', label: 'Just starting out' },
        { value: 'mid', label: 'Some experience' },
        { value: 'pro', label: 'Experienced creator' },
    ],
    goals: [
        { value: 'goal_one', label: 'Goal one' },
        { value: 'goal_two', label: 'Goal two' },
        { value: 'goal_three', label: 'Goal three' },
    ],
    steps: [
        { step: 0, key: 'niche', label: 'What do you make content about?' },
        { step: 1, key: 'subtopics', label: 'Which subtopics interest you?' },
        { step: 2, key: 'platforms', label: 'Where do you publish?' },
        { step: 3, key: 'experience', label: 'How experienced are you?' },
        { step: 4, key: 'goals', label: 'What are you aiming for?' },
        { step: 5, key: 'review', label: 'Review your choices' },
    ],
    constraints: { minSubtopics: 3, maxSubtopics: 8, maxInterests: 12, maxPlatforms: 3 },
};

/** A taxonomy long enough to require search (>15 on one step). */
export const longOptions: OnboardingOptions = {
    ...testOptions,
    niches: [
        {
            slug: 'alpha',
            label: 'Alpha niche',
            subtopics: Array.from({ length: 40 }, (_, index) => `Fixture topic ${index + 1}`),
        },
    ],
};

export const emptyState: OnboardingState = {
    onboardingCompleted: false,
    onboardingStep: 0,
    niche: null,
    interests: [],
    preferredPlatforms: [],
    experience: null,
    goals: [],
};

export const completeState: OnboardingState = {
    onboardingCompleted: true,
    onboardingStep: 5,
    niche: 'Alpha one',
    interests: [
        { topic: 'Alpha one', weight: 1 },
        { topic: 'Alpha two', weight: 1 },
        { topic: 'Alpha three', weight: 1 },
    ],
    preferredPlatforms: ['youtube'],
    experience: 'starter',
    goals: ['goal_one'],
};
