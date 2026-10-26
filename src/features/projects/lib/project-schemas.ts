import { z } from 'zod';

import { PROJECT_LIMITS, PROJECT_PLATFORMS, PROJECT_TONES } from './project-constants';

export * from './project-constants';

/**
 * The form schema and the vocabulary it validates against. Constants live in
 * `project-constants.ts` so label-only consumers do not pull zod into their
 * bundle (T20).
 */
export const projectFormSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Title is required')
        .max(PROJECT_LIMITS.title, `Title must be ${PROJECT_LIMITS.title} characters or fewer`),
    description: z
        .string()
        .trim()
        .max(
            PROJECT_LIMITS.description,
            `Description must be ${PROJECT_LIMITS.description} characters or fewer`
        ),
    idea: z
        .string()
        .trim()
        .min(1, 'Content idea is required')
        .max(PROJECT_LIMITS.idea, `Idea must be ${PROJECT_LIMITS.idea} characters or fewer`),
    platform: z.enum(PROJECT_PLATFORMS),
    tone: z.enum(PROJECT_TONES),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
