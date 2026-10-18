import { z } from 'zod';

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
    label: string;
    test: (value: string) => boolean;
}

export const passwordChecks: readonly PasswordCheck[] = [
    {
        id: 'length',
        label: `At least ${PASSWORD_MIN_LENGTH} characters`,
        test: (value) => value.length >= PASSWORD_MIN_LENGTH,
    },
    {
        id: 'uppercase',
        label: 'An uppercase letter',
        test: (value) => PASSWORD_PATTERNS.uppercase.test(value),
    },
    {
        id: 'lowercase',
        label: 'A lowercase letter',
        test: (value) => PASSWORD_PATTERNS.lowercase.test(value),
    },
    {
        id: 'digit',
        label: 'A number',
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

export const passwordSchema = z
    .string()
    .min(PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters.')
    .max(PASSWORD_MAX_LENGTH, 'Password is too long.')
    .regex(PASSWORD_PATTERNS.uppercase, 'Password must contain at least one uppercase letter.')
    .regex(PASSWORD_PATTERNS.lowercase, 'Password must contain at least one lowercase letter.')
    .regex(PASSWORD_PATTERNS.digit, 'Password must contain at least one number.');
