/**
 * AR-029 — the numeric constraints, split out of the schema module so the
 * validation COPY can build its English defaults without a circular import.
 * The parity test still pins these against the API's advertised constraints.
 */
export const ONBOARDING_LIMITS = {
    minSubtopics: 3,
    maxSubtopics: 8,
    maxInterests: 12,
    maxPlatforms: 3,
} as const;
