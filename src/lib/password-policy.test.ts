import { describe, expect, it } from 'vitest';

import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    passwordChecks,
    passwordIssues,
    passwordSchema,
    passwordScore,
} from './password-policy';

/**
 * T12: the behavioural matrix mirroring c0c-bake `auth.validation.ts` /
 * `auth.recovery.validation.ts` (min 8, upper, lower, digit). Each case is a
 * password the BACKEND must accept or reject — if either side drifts, one of
 * these rows fails instead of a user hitting a proxied 400.
 */
const BACKEND_MATRIX: Array<{ password: string; accepted: boolean; note: string }> = [
    { password: 'Password1', accepted: true, note: 'the canonical happy path' },
    { password: 'aB3aB3aB', accepted: true, note: 'exactly 8 chars' },
    { password: 'sh0rtAa', accepted: false, note: '7 chars — one below min' },
    { password: 'alllowercase1', accepted: false, note: 'no uppercase' },
    { password: 'ALLUPPERCASE1', accepted: false, note: 'no lowercase' },
    { password: 'NoDigitsHere', accepted: false, note: 'no digit' },
    { password: '', accepted: false, note: 'empty' },
];

describe('password policy (shared with the backend)', () => {
    it.each(BACKEND_MATRIX)('$note: $password', ({ password, accepted }) => {
        expect(passwordSchema.safeParse(password).success).toBe(accepted);
    });

    it('rejects values above the shared maximum', () => {
        const tooLong = `A1${'a'.repeat(PASSWORD_MAX_LENGTH)}`;
        expect(passwordSchema.safeParse(tooLong).success).toBe(false);
    });

    it('has one check per backend rule, in display order', () => {
        expect(passwordChecks.map((check) => check.id)).toEqual([
            'length',
            'uppercase',
            'lowercase',
            'digit',
        ]);
    });

    it('passwordIssues names exactly the failed rules', () => {
        expect(passwordIssues('alllowercase1').map((c) => c.id)).toEqual(['uppercase']);
        expect(passwordIssues('NoDigitsHere').map((c) => c.id)).toEqual(['digit']);
        expect(passwordIssues('').map((c) => c.id)).toEqual([
            'length',
            'uppercase',
            'lowercase',
            'digit',
        ]);
        expect(passwordIssues('Password1')).toEqual([]);
    });

    it('passwordScore counts satisfied rules (drives the strength meter)', () => {
        expect(passwordScore('')).toBe(0);
        expect(passwordScore('alllowercase1')).toBe(3);
        expect(passwordScore('Password1')).toBe(4);
    });

    it('the length check uses the exported minimum, not a hardcoded copy', () => {
        const lengthCheck = passwordChecks.find((check) => check.id === 'length');
        expect(lengthCheck?.test('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(false);
        expect(lengthCheck?.test('a'.repeat(PASSWORD_MIN_LENGTH))).toBe(true);
    });
});
