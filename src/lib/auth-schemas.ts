import { z } from 'zod';

/**
 * BFF request schemas (T09 / R-25). These mirror c0c-bake
 * `src/modules/auth/auth.validation.ts` — same limits, so the user gets a
 * useful field error here instead of a proxied backend 400.
 *
 * Both schemas are strict: unknown keys are rejected rather than forwarded.
 */

/**
 * Pragmatic email shape check, deliberately looser than zod v4's `z.email()`
 * (which rejects single-char TLDs like the pinned tests' `a@b.c`). The BFF is
 * an early filter, not the authority — the backend's stricter validator is,
 * and its 400 passes through unchanged.
 */
const emailShape = z
    .string()
    .min(3, 'Invalid email address.')
    .max(254, 'Email is too long.')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address.');

export const loginSchema = z.strictObject({
    email: emailShape,
    password: z.string().min(1, 'Password is required.').max(200, 'Password is too long.'),
});

export const registerSchema = z.strictObject({
    email: emailShape,
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters.')
        .max(200, 'Password is too long.')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
        .regex(/[0-9]/, 'Password must contain at least one number.'),
    firstName: z.string().min(1, 'First name is required.').max(50, 'First name is too long.'),
    lastName: z.string().min(1, 'Last name is required.').max(50, 'Last name is too long.'),
});
