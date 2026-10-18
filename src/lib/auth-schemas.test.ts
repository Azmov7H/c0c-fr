import { describe, expect, it } from 'vitest';

import {
    changePasswordSchema,
    emailField,
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resendVerificationSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from './auth-schemas';
import { passwordSchema } from './password-policy';

const VALID_TOKEN = 'a'.repeat(43);

describe('BFF auth schemas (T12 additions)', () => {
    describe('emailField', () => {
        it('accepts pragmatic addresses, including single-char TLDs', () => {
            for (const email of ['a@b.c', 'user+tag@example.co.uk']) {
                expect(emailField.safeParse(email).success).toBe(true);
            }
        });

        it('rejects malformed addresses', () => {
            for (const email of ['not-an-email', 'a@b', 'a b@c.d', '@b.c']) {
                expect(emailField.safeParse(email).success).toBe(false);
            }
        });
    });

    describe('registerSchema', () => {
        it('uses the shared policy object, not a copy', () => {
            expect(registerSchema.shape.password).toBe(passwordSchema);
        });

        it('rejects unknown keys (strict, never forwarded)', () => {
            const result = registerSchema.safeParse({
                email: 'a@b.c',
                password: 'Password1',
                firstName: 'A',
                lastName: 'B',
                isAdmin: true,
            });
            expect(result.success).toBe(false);
        });
    });

    describe('loginSchema', () => {
        it('does not apply the registration policy to logins', () => {
            // Existing accounts may predate the policy; the login form must not
            // block them client-side.
            expect(loginSchema.safeParse({ email: 'a@b.c', password: 'old' }).success).toBe(true);
        });
    });

    describe('forgotPasswordSchema', () => {
        it('accepts one email and nothing else', () => {
            expect(forgotPasswordSchema.safeParse({ email: 'a@b.c' }).success).toBe(true);
            expect(forgotPasswordSchema.safeParse({ email: 'a@b.c', extra: 1 }).success).toBe(false);
            expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
        });
    });

    describe('resetPasswordSchema', () => {
        it('enforces the 20-char backend token floor', () => {
            expect(resetPasswordSchema.safeParse({ token: VALID_TOKEN, newPassword: 'Password1' }).success).toBe(true);
            expect(
                resetPasswordSchema.safeParse({ token: 'a'.repeat(19), newPassword: 'Password1' }).success
            ).toBe(false);
        });

        it('applies the full password policy to the new password', () => {
            expect(
                resetPasswordSchema.safeParse({ token: VALID_TOKEN, newPassword: 'weak' }).success
            ).toBe(false);
        });
    });

    describe('verifyEmailSchema', () => {
        it('accepts a token and rejects short or extra fields', () => {
            expect(verifyEmailSchema.safeParse({ token: VALID_TOKEN }).success).toBe(true);
            expect(verifyEmailSchema.safeParse({ token: 'short' }).success).toBe(false);
            expect(verifyEmailSchema.safeParse({ token: VALID_TOKEN, email: 'a@b.c' }).success).toBe(false);
        });
    });

    describe('changePasswordSchema', () => {
        it('requires the current password and a policy-compliant new one', () => {
            expect(
                changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'Password1' }).success
            ).toBe(true);
            expect(
                changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'Password1' }).success
            ).toBe(false);
            expect(
                changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'Password1', id: 'x' })
                    .success
            ).toBe(false);
        });
    });

    describe('resendVerificationSchema', () => {
        it('pins the body to exactly {}', () => {
            expect(resendVerificationSchema.safeParse({}).success).toBe(true);
            expect(resendVerificationSchema.safeParse({ email: 'a@b.c' }).success).toBe(false);
        });
    });
});
