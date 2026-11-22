import type { useTranslations } from 'next-intl';

import { PROJECT_LIMITS } from './project-constants';

/**
 * AR-030 — the project-form validation messages are catalog copy, exactly as
 * the AR-029 onboarding batch made theirs (`onboarding-validation-messages.ts`).
 * The zod schema in `project-schemas.ts` takes a message bag, so pure
 * schema-level callers keep English behavior while the wizard builds the
 * translated bag through `projectsValidationMessages(t)` and hands it to
 * `projectFormSchema(messages)`.
 */
export type ProjectsTranslator = ReturnType<typeof useTranslations<'projects'>>;

export interface ProjectFormMessages {
    titleRequired: string;
    titleTooLong: string;
    descriptionTooLong: string;
    ideaRequired: string;
    ideaTooLong: string;
}

export const EN_PROJECT_FORM_MESSAGES: ProjectFormMessages = {
    titleRequired: 'Title is required',
    titleTooLong: `Title must be ${PROJECT_LIMITS.title} characters or fewer`,
    descriptionTooLong: `Description must be ${PROJECT_LIMITS.description} characters or fewer`,
    ideaRequired: 'Content idea is required',
    ideaTooLong: `Idea must be ${PROJECT_LIMITS.idea} characters or fewer`,
};

export function projectsValidationMessages(t: ProjectsTranslator): ProjectFormMessages {
    return {
        titleRequired: t('validation.titleRequired'),
        titleTooLong: t('validation.titleTooLong', { limit: PROJECT_LIMITS.title }),
        descriptionTooLong: t('validation.descriptionTooLong', { limit: PROJECT_LIMITS.description }),
        ideaRequired: t('validation.ideaRequired'),
        ideaTooLong: t('validation.ideaTooLong', { limit: PROJECT_LIMITS.idea }),
    };
}
