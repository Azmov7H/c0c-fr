import type { useTranslations } from 'next-intl';

import { ONBOARDING_LIMITS } from './onboarding-limits';

/**
 * Declared here (not only imported) so the i18n usage scanner can see that the
 * `t` parameter below is the `onboarding` translator — the same pattern the
 * auth validation seam uses. The type is identical to the one in
 * `taxonomy-labels.ts`; both name next-intl's own translator type, so a key
 * that does not exist in the catalog is a TYPE ERROR.
 */
export type OnboardingTranslator = ReturnType<typeof useTranslations<'onboarding'>>;

/**
 * AR-029 — the wizard's validation sentences are COPY, so both languages get
 * them from the `onboarding` catalog.
 *
 * The schemas (and the pure `validateStepAnswer`/`missingForCompletion` helpers)
 * stay translator-free: callers hand them a bag of strings. `EN_VALIDATION_MESSAGES`
 * is the bag the API and the existing English tests use — the pre-extraction
 * sentences verbatim, which makes the English floor explicit in code.
 */
export interface OnboardingValidationMessages {
    chooseOneNiche: string;
    chooseListedNiche: string;
    chooseSubtopics: string;
    subtopicFromList: string;
    choosePlatforms: string;
    pickExperience: string;
    pickListedExperience: string;
    pickAtLeastOneGoal: string;
    goalFromList: string;
    missingNiche: string;
    missingSubtopics: string;
    missingPlatform: string;
    missingExperience: string;
    missingGoal: string;
}

const MIN_PLATFORMS = 1;

/** The English defaults — the exact strings the wizard rendered before AR-029. */
export const EN_VALIDATION_MESSAGES: OnboardingValidationMessages = {
    chooseOneNiche: 'Choose one niche to continue.',
    chooseListedNiche: 'Choose one of the listed niches.',
    chooseSubtopics: `Choose between ${ONBOARDING_LIMITS.minSubtopics} and ${ONBOARDING_LIMITS.maxSubtopics} subtopics.`,
    subtopicFromList: 'Every subtopic must come from the list.',
    choosePlatforms: `Choose between ${MIN_PLATFORMS} and ${ONBOARDING_LIMITS.maxPlatforms} platforms.`,
    pickExperience: 'Pick your experience level.',
    pickListedExperience: 'Pick one of the listed experience levels.',
    pickAtLeastOneGoal: 'Pick at least one goal.',
    goalFromList: 'Every goal must come from the list.',
    missingNiche: 'a niche',
    missingSubtopics: `${ONBOARDING_LIMITS.minSubtopics}–${ONBOARDING_LIMITS.maxSubtopics} subtopics`,
    missingPlatform: 'at least one platform',
    missingExperience: 'your experience level',
    missingGoal: 'at least one goal',
};

/** Builds the bag from the current locale's catalog. */
export function onboardingValidationMessages(
    t: OnboardingTranslator
): OnboardingValidationMessages {
    return {
        chooseOneNiche: t('validation.chooseOneNiche'),
        chooseListedNiche: t('validation.chooseListedNiche'),
        chooseSubtopics: t('validation.chooseSubtopics', {
            min: ONBOARDING_LIMITS.minSubtopics,
            max: ONBOARDING_LIMITS.maxSubtopics,
        }),
        subtopicFromList: t('validation.subtopicFromList'),
        choosePlatforms: t('validation.choosePlatforms', {
            min: MIN_PLATFORMS,
            max: ONBOARDING_LIMITS.maxPlatforms,
        }),
        pickExperience: t('validation.pickExperience'),
        pickListedExperience: t('validation.pickListedExperience'),
        pickAtLeastOneGoal: t('validation.pickAtLeastOneGoal'),
        goalFromList: t('validation.goalFromList'),
        missingNiche: t('validation.missingNiche'),
        missingSubtopics: t('validation.missingSubtopics', {
            min: ONBOARDING_LIMITS.minSubtopics,
            max: ONBOARDING_LIMITS.maxSubtopics,
        }),
        missingPlatform: t('validation.missingPlatform'),
        missingExperience: t('validation.missingExperience'),
        missingGoal: t('validation.missingGoal'),
    };
}
