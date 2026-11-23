import { z } from 'zod';

/**
 * AR-028 — the profile form's validation copy.
 *
 * The schema used to be built at module load with English messages, so an
 * Arabic form still showed English errors. It is now built from the catalog,
 * per locale, and memoized by caller so the form does not get a new resolver on
 * every render.
 */
export interface ProfileSchemaMessages {
    firstNameRequired: string;
    lastNameRequired: string;
    emailInvalid: string;
    firstNameTooLong: string;
    lastNameTooLong: string;
    emailTooLong: string;
}

export type ProfileSchema = ReturnType<typeof createProfileSchema>;
export type ProfileValues = z.infer<ProfileSchema>;

export function createProfileSchema(messages: ProfileSchemaMessages) {
    return z.object({
        firstName: z
            .string()
            .trim()
            .min(1, messages.firstNameRequired)
            .max(80, messages.firstNameTooLong),
        lastName: z
            .string()
            .trim()
            .min(1, messages.lastNameRequired)
            .max(80, messages.lastNameTooLong),
        email: z
            .string()
            .trim()
            .email(messages.emailInvalid)
            .max(254, messages.emailTooLong),
    });
}
