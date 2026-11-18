import { z } from 'zod';

import {
    DEFAULT_AUTH_SCHEMA_MESSAGES,
    type AuthSchemaMessages,
} from './auth-schema-messages';
import { PASSWORD_MAX_LENGTH, passwordSchema } from './password-policy';

/**
 * BFF request schemas (T09 / R-25, extended in T12). These mirror c0c-bake
 * `src/modules/auth/auth.validation.ts` and `auth.recovery.validation.ts` —
 * same limits, so the user gets a useful field error here instead of a proxied
 * backend 400.
 *
 * All schemas are strict: unknown keys are rejected rather than forwarded.
 *
 * AR-026: the schemas are FACTORIES now. The messages they carry are copy,
 * and copy comes from the catalog — the browser forms hand the schema the
 * visitor's language, while the API routes call the factory without a bag
 * and keep the English sentences the BFF has always sent (the API is a data
 * boundary; `auth-schema-messages.ts` says so).
 *
 * Every factory memoizes per message bag, so a bag always yields the SAME
 * schema objects: the signup form's schema really does share the password
 * policy object instead of copying it.
 */

/**
 * Pragmatic email shape check, deliberately looser than zod v4's `z.email()`
 * (which rejects single-char TLDs like the pinned tests' `a@b.c`). The BFF is
 * an early filter, not the authority — the backend's stricter validator is,
 * and its 400 passes through unchanged.
 */
function buildSchemas(messages: AuthSchemaMessages) {
    const emailField = z
        .string()
        .min(3, messages.invalidEmail)
        .max(254, messages.emailTooLong)
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, messages.invalidEmail);

    /** Security tokens are 43-char base64url strings; 20 matches the backend floor. */
    const securityTokenField = z
        .string()
        .min(20, messages.invalidLink)
        .max(256, messages.invalidLink);

    return {
        emailField,
        login: z.strictObject({
            email: emailField,
            password: z
                .string()
                .min(1, messages.passwordRequired)
                .max(PASSWORD_MAX_LENGTH, messages.passwordTooLong),
        }),
        register: z.strictObject({
            email: emailField,
            // Shared policy object, not a copy — password-policy.ts asserts
            // this is the same schema instance the strength meter derives from.
            password: passwordSchema(messages),
            firstName: z
                .string()
                .min(1, messages.firstNameRequired)
                .max(50, messages.firstNameTooLong),
            lastName: z
                .string()
                .min(1, messages.lastNameRequired)
                .max(50, messages.lastNameTooLong),
        }),
        forgotPassword: z.strictObject({
            email: emailField,
        }),
        resetPassword: z.strictObject({
            token: securityTokenField,
            newPassword: passwordSchema(messages),
        }),
        verifyEmail: z.strictObject({
            token: securityTokenField,
        }),
        changePassword: z.strictObject({
            currentPassword: z
                .string()
                .min(1, messages.currentPasswordRequired)
                .max(PASSWORD_MAX_LENGTH, messages.passwordTooLong),
            newPassword: passwordSchema(messages),
        }),
        /** The backend accepts an absent body; the BFF pins it to exactly `{}`. */
        resendVerification: z.strictObject({}),
    };
}

/** The schema instances, one per message bag. */
const cache = new WeakMap<AuthSchemaMessages, ReturnType<typeof buildSchemas>>();

function schemasFor(messages: AuthSchemaMessages): ReturnType<typeof buildSchemas> {
    const cached = cache.get(messages);
    if (cached) return cached;
    const built = buildSchemas(messages);
    cache.set(messages, built);
    return built;
}

/** The email field — the shape both the login and the recovery form use. */
export function emailField(messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES) {
    return schemasFor(messages).emailField;
}

export function loginSchema(messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES) {
    return schemasFor(messages).login;
}

export function registerSchema(messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES) {
    return schemasFor(messages).register;
}

export function forgotPasswordSchema(messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES) {
    return schemasFor(messages).forgotPassword;
}

export function resetPasswordSchema(messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES) {
    return schemasFor(messages).resetPassword;
}

export function verifyEmailSchema(messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES) {
    return schemasFor(messages).verifyEmail;
}

export function changePasswordSchema(messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES) {
    return schemasFor(messages).changePassword;
}

export function resendVerificationSchema(
    messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES
) {
    return schemasFor(messages).resendVerification;
}
