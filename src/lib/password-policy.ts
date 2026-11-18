import { z } from 'zod';

import {
    DEFAULT_AUTH_SCHEMA_MESSAGES,
    type AuthSchemaMessages,
} from './auth-schema-messages';

/**
 * The one password policy (T12).
 *
 * The rule is spelled once, here, and consumed by:
 *   - the BFF request schemas (`src/lib/auth-schemas.ts`),
 *   - every signed-up/auth form's zod schema,
 *   - the strength meter checklist in the UI.
 *
 * Backend mirror: c0c-bake `src/modules/auth/auth.validation.ts` and
 * `auth.recovery.validation.ts` — min 8, at least one uppercase, one
 * lowercase, one digit. `password-policy.test.ts` pins a behavioural matrix
 * against those exact constraints so a change on either side fails CI instead
 * of silently rejecting users at the API boundary.
 *
 * AR-026: the schema is a FACTORY now — the messages it carries are copy
 * (the catalog's), and the API's default bag keeps the English sentences
 * the BFF has always sent. The factory memoizes per message bag, so the
 * policy object is still ONE object per bag (the signup form's schema really
 * does share it) rather than a copy per call.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;

export const PASSWORD_PATTERNS = {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    digit: /[0-9]/,
} as const;

export type PasswordCheckId = 'length' | 'uppercase' | 'lowercase' | 'digit';

export interface PasswordCheck {
    id: PasswordCheckId;
    /**
     * The CHECK is code; its LABEL is copy — the catalog's
     * (`password.checks.<id>`), because the meter shows it to the visitor.
     */
    test: (value: string) => boolean;
}

export const passwordChecks: readonly PasswordCheck[] = [
    {
        id: 'length',
        test: (value) => value.length >= PASSWORD_MIN_LENGTH,
    },
    {
        id: 'uppercase',
        test: (value) => PASSWORD_PATTERNS.uppercase.test(value),
    },
    {
        id: 'lowercase',
        test: (value) => PASSWORD_PATTERNS.lowercase.test(value),
    },
    {
        id: 'digit',
        test: (value) => PASSWORD_PATTERNS.digit.test(value),
    },
];

/** Checks the value fails, in display order. Empty result = policy satisfied. */
export function passwordIssues(value: string): readonly PasswordCheck[] {
    return passwordChecks.filter((check) => !check.test(value));
}

/** 0–4, the number of satisfied checks — drives the strength meter. */
export function passwordScore(value: string): number {
    return passwordChecks.length - passwordIssues(value).length;
}

/** The schema instances, one per message bag. */
const schemas = new WeakMap<AuthSchemaMessages, z.ZodString>();

/**
 * The password schema, in the language of the messages it is given.
 *
 * The bag is the key, so the same bag always yields the SAME schema object —
 * the property the signup form's schema relies on.
 */
export function passwordSchema(
    messages: AuthSchemaMessages = DEFAULT_AUTH_SCHEMA_MESSAGES
): z.ZodString {
    const cached = schemas.get(messages);
    if (cached) return cached;

    const schema = z
        .string()
        .min(PASSWORD_MIN_LENGTH, messages.passwordTooShort)
        .max(PASSWORD_MAX_LENGTH, messages.passwordTooLong)
        .regex(PASSWORD_PATTERNS.uppercase, messages.passwordNeedsUppercase)
        .regex(PASSWORD_PATTERNS.lowercase, messages.passwordNeedsLowercase)
        .regex(PASSWORD_PATTERNS.digit, messages.passwordNeedsDigit);

    schemas.set(messages, schema);
    return schema;
}
