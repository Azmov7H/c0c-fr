import { z } from 'zod';

import { PROJECT_LIMITS, PROJECT_PLATFORMS, PROJECT_TONES } from './project-constants';
import {
    EN_PROJECT_FORM_MESSAGES,
    type ProjectFormMessages,
} from './projects-validation-messages';

export * from './project-constants';

/**
 * The form schema and the vocabulary it validates against. Constants live in
 * `project-constants.ts` so label-only consumers do not pull zod into their
 * bundle (T20).
 *
 * The messages are a factory parameter (not a module-level value) so the
 * wizard can build the schema per locale — see
 * `projects-validation-messages.ts`. Pure schema-level callers (the schema
 * unit test, other suites) pass nothing and get the English bag.
 *
 * P04: `contentFormat` + `durationSeconds` are D8-free. Language/voice/
 * dialect are deliberately absent — they are D8-blocked until the provider
 * matrix verifies them (see `configuration-options` on the backend).
 */
export function projectFormSchema(messages: ProjectFormMessages = EN_PROJECT_FORM_MESSAGES) {
    return z.object({
        title: z
            .string()
            .trim()
            .min(1, messages.titleRequired)
            .max(PROJECT_LIMITS.title, messages.titleTooLong),
        description: z
            .string()
            .trim()
            .max(PROJECT_LIMITS.description, messages.descriptionTooLong),
        idea: z
            .string()
            .trim()
            .min(1, messages.ideaRequired)
            .max(PROJECT_LIMITS.idea, messages.ideaTooLong),
        platform: z.enum(PROJECT_PLATFORMS),
        tone: z.enum(PROJECT_TONES),
        contentFormat: z.enum(['long', 'short']).optional(),
        durationSeconds: z.number().int().min(15).max(3600).optional(),
    });
}

export type ProjectFormValues = z.infer<ReturnType<typeof projectFormSchema>>;
