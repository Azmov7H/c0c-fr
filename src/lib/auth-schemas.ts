import { z } from 'zod';

import { PASSWORD_MAX_LENGTH, passwordSchema } from './password-policy';

/**
 * BFF request schemas (T09 / R-25, extended in T12). These mirror c0c-bake
 * `src/modules/auth/auth.validation.ts` and `auth.recovery.validation.ts` —
 * same limits, so the user gets a useful field error here instead of a proxied
 * backend 400.
 *
 * All schemas are strict: unknown keys are rejected rather than forwarded.
 */

/**
 * Pragmatic email shape check, deliberately looser than zod v4's `z.email()`
 * (which rejects single-char TLDs like the pinned tests' `a@b.c`). The BFF is
 * an early filter, not the authority — the backend's stricter validator is,
 * and its 400 passes through unchanged.
 */
export const emailField = z
    .string()
    .min(3, 'Invalid email address.')
    .max(254, 'Email is too long.')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address.');

export const loginSchema = z.strictObject({
    email: emailField,
    password: z.string().min(1, 'Password is required.').max(PASSWORD_MAX_LENGTH, 'Password is too long.'),
});

export const registerSchema = z.strictObject({
    email: emailField,
    // Shared policy object, not a copy — password-policy.test.ts asserts this
    // is the same schema instance the strength meter derives from.
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required.').max(50, 'First name is too long.'),
    lastName: z.string().min(1, 'Last name is required.').max(50, 'Last name is too long.'),
});

/** Security tokens are 43-char base64url strings; 20 matches the backend floor. */
const securityTokenField = z
    .string()
    .min(20, 'This link is invalid.')
    .max(256, 'This link is invalid.');

export const forgotPasswordSchema = z.strictObject({
    email: emailField,
});

export const resetPasswordSchema = z.strictObject({
    token: securityTokenField,
    newPassword: passwordSchema,
});

export const verifyEmailSchema = z.strictObject({
    token: securityTokenField,
});

export const changePasswordSchema = z.strictObject({
    currentPassword: z
        .string()
        .min(1, 'Current password is required.')
        .max(PASSWORD_MAX_LENGTH, 'Password is too long.'),
    newPassword: passwordSchema,
});

/** The backend accepts an absent body; the BFF pins it to exactly `{}`. */
export const resendVerificationSchema = z.strictObject({});
