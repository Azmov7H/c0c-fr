import { describe, expect, it } from 'vitest';

import ar from '../../../messages/ar/auth.json';
import en from '../../../messages/en/auth.json';
import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';

/**
 * AR-026 — the auth extraction.
 *
 * The auth cards were the last English surface a NEW visitor meets. This
 * suite proves the same four things AR-022/023/024 proved for their surfaces:
 *
 *   1. the SURFACE reads its copy from the catalog — the shared scanner fails
 *      on English still written in the source;
 *   2. the ENGLISH did not change — the catalog carries, verbatim, the
 *      sentences the cards rendered before the extraction;
 *   3. the ARABIC is really Arabic — nothing is empty, nothing is a copy of
 *      its English counterpart;
 *   4. the PLACEHOLDERS survive the translation — `{seconds}`, `{reference}`,
 *      `{count}`, `{year}`, `{score}`, `{total}` are fill-ins, and an Arabic
 *      sentence that loses one renders a literal `{reference}`.
 */

/** The surface this batch owns. */
const SURFACE = [
    'src/features/auth/components/auth-form-layout.tsx',
    'src/features/auth/components/auth-error-alert.tsx',
    'src/features/auth/components/password-input.tsx',
    'src/features/auth/components/password-strength-meter.tsx',
    'src/features/auth/components/login-form.tsx',
    'src/features/auth/components/signup-form.tsx',
    'src/features/auth/components/forgot-password-form.tsx',
    'src/features/auth/components/reset-password-form.tsx',
    'src/features/auth/components/change-password-form.tsx',
    'src/features/auth/components/verify-email-panel.tsx',
    'src/features/auth/components/email-verification-banner.tsx',
    'src/features/auth/hooks/use-auth.ts',
];

/** The brand is a proper noun; it is not translated. */
const ALLOWED = ['Arch-AI', 'C0C'];

type Catalog = typeof en;

/**
 * The English the cards rendered BEFORE the extraction (AR-026), verbatim.
 *
 * This is the regression floor in test form: if the catalog's English is
 * edited, this test fails and the edit has to be deliberate.
 */
const ENGLISH_FLOOR: Pick<
    Catalog,
    'layout' | 'login' | 'signup' | 'forgotPassword' | 'resetPassword' | 'changePassword'
> = {
    layout: { copyright: '© {year} Arch-AI Content Engine' },
    login: {
        heading: 'Welcome back',
        subheading: 'Empower your content with Arch-AI',
        title: 'Sign In',
        description: 'Enter your credentials to access your workspace',
        emailLabel: 'Email Address',
        passwordLabel: 'Password',
        forgotPassword: 'Forgot password?',
        submit: 'Sign In to Dashboard',
        submitting: 'Authenticating...',
        footerPrompt: 'New to Arch-AI?',
        footerLink: 'Create Free Account',
        success: {
            reset: 'Your password has been reset. Sign in with your new password.',
            changed: 'Password changed. For security, every device was signed out — sign in again.',
            signout: 'You have been signed out on all devices.',
            verified: 'Email verified. Sign in to continue.',
        },
    },
    signup: {
        heading: 'Create Account',
        subheading: 'Join the next generation of AI content creators',
        title: 'Sign Up',
        description:
            'One account, then pick what to build — thumbnails, scripts, sound effects and images all live in one project.',
        intro: {
            lead: 'Free to start. After signup you pick your interests, and your workspace opens ready to generate',
            separator: ', ',
            lastSeparator: ' and ',
            tail: '.',
        },
        assets: {
            thumbnails: 'Thumbnails',
            scripts: 'Scripts',
            soundEffects: 'Sound Effects',
            images: 'Images',
        },
        firstNameLabel: 'First Name',
        lastNameLabel: 'Last Name',
        emailLabel: 'Email Address',
        passwordLabel: 'Password',
        termsPrefix: 'I agree to the',
        termsLink: 'Terms of Service',
        termsMiddle: 'and',
        privacyLink: 'Privacy Policy',
        termsTail: '.',
        submit: 'Create Free Account',
        submitting: 'Creating account...',
        footerPrompt: 'Already have an account?',
        footerLink: 'Sign In Instead',
        firstNamePlaceholder: 'Jane',
        lastNamePlaceholder: 'Doe',
        emailPlaceholder: 'name@company.com',
    },
    forgotPassword: {
        heading: 'Forgot password?',
        subheading: "We'll email you a link to reset it",
        title: 'Reset Password',
        description: 'Enter the email you signed up with.',
        emailLabel: 'Email Address',
        submit: 'Send Reset Link',
        submitting: 'Sending link...',
        footerPrompt: 'Remembered it after all?',
        footerLink: 'Back to sign in',
        sent: {
            heading: 'Check your inbox',
            subheading: "We've got you covered",
            title: 'Reset Link Sent',
            description: 'Follow the link in the email to choose a new password.',
            confirmation:
                "If an account exists for that email, we've sent a reset link. The link is valid for 1 hour.",
            hint: "Didn't arrive? Check spam, or try a different email address.",
            retry: 'Try a different email',
        },
    },
    resetPassword: {
        heading: 'Choose a new password',
        subheading: "Make it one you haven't used before",
        title: 'Reset Password',
        description:
            "This signs you out everywhere and signs in nobody — you'll use the new password on the login page.",
        newPasswordLabel: 'New Password',
        confirmLabel: 'Confirm New Password',
        submit: 'Reset Password',
        submitting: 'Resetting password...',
        footerPrompt: 'Changed your mind?',
        footerLink: 'Back to sign in',
        expiredPrompt: 'Link expired or already used?',
        expiredLink: 'Request a new one',
        invalid: {
            heading: 'Link problem',
            subheading: "This reset link can't be used",
            title: 'Reset Link Unusable',
            description: 'Request a fresh link and it will work like this one should have.',
            missing: 'This reset link is missing its token.',
            malformed:
                "This reset link doesn't look complete — it may have been truncated by the email client.",
            footerPrompt: 'Prefer to sign in?',
            footerLink: 'Back to sign in',
            request: 'Request a new reset link',
        },
    },
    changePassword: {
        warningTitle: 'Changing your password signs you out everywhere',
        warningBody:
            "All active sessions end, including this one. You'll sign back in with the new password — other devices will need it too.",
        currentLabel: 'Current Password',
        newLabel: 'New Password',
        confirmLabel: 'Confirm New Password',
        submit: 'Change Password',
        submitting: 'Changing password...',
    },
};

function flatten(value: unknown, prefix = ''): Record<string, string> {
    const out: Record<string, string> = {};
    if (typeof value !== 'object' || value === null) return { [prefix]: String(value) };
    for (const [key, child] of Object.entries(value)) {
        if (prefix === '' && key.startsWith('@')) continue;
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholders(value: string): string[] {
    return [...value.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
}

describe('AR-026 the auth extraction', () => {
    it('the surface has no English copy left in the source', () => {
        const leftovers = SURFACE.flatMap((file) =>
            hardcodedCopy(file, { allowed: ALLOWED }).map((text) => `${file}: ${text}`)
        );
        expect(leftovers).toEqual([]);
    });

    it('the English is the copy the cards rendered before the extraction', () => {
        for (const [section, value] of Object.entries(ENGLISH_FLOOR)) {
            for (const [key, expected] of Object.entries(flatten(value))) {
                const actual = (en as Record<string, unknown>)[section];
                const fromCatalog = flatten({ [section]: actual })[`${section}.${key}`];
                expect(fromCatalog, `${section}.${key}`).toBe(expected);
            }
        }
    });

    it('the Arabic is really Arabic: nothing empty, nothing a copy of the English', () => {
        const english = flatten(en);
        const arabic = flatten(ar);
        expect(Object.keys(arabic).sort()).toEqual(Object.keys(english).sort());

        for (const [key, value] of Object.entries(arabic)) {
            expect(value, `ar ${key} is empty`).not.toBe('');
            // The brand, the email example and the separators are intentionally
            // the same in both languages.
            const sharedByDesign =
                value.includes('Arch-AI') ||
                value === 'name@company.com' ||
                /^[\s,.]*$/.test(value);
            if (!sharedByDesign) {
                expect(value, `ar ${key} is the English string`).not.toBe(english[key]);
            }
        }
    });

    it('every placeholder survives the translation', () => {
        const english = flatten(en);
        const arabic = flatten(ar);
        for (const [key, value] of Object.entries(english)) {
            expect(placeholders(arabic[key]), `ar ${key}`).toEqual(placeholders(value));
        }
    });

    it('the Arabic copy is Arabic script where it is prose', () => {
        const arabic = flatten(ar);
        for (const [key, value] of Object.entries(arabic)) {
            if (!value.includes('Arch-AI') && value !== 'name@company.com' && !/^[\s,.]*$/.test(value)) {
                expect.soft(/[\u0600-\u06FF]/.test(value), `ar ${key} has no Arabic letters`).toBe(true);
            }
        }
    });
});
