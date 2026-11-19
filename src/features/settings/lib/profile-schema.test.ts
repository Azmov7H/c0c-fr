import { describe, expect, it } from 'vitest';

import arSettings from '../../../../messages/ar/settings.json';
import enSettings from '../../../../messages/en/settings.json';
import { createProfileSchema } from './profile-schema';

/** AR-028 — the profile form's validation copy is catalog copy, not code. */
const enMessages = {
    firstNameRequired: enSettings.validation.firstNameRequired,
    lastNameRequired: enSettings.validation.lastNameRequired,
    emailInvalid: enSettings.validation.emailInvalid,
    firstNameTooLong: enSettings.validation.firstNameTooLong,
    lastNameTooLong: enSettings.validation.lastNameTooLong,
    emailTooLong: enSettings.validation.emailTooLong,
};

const arMessages = {
    firstNameRequired: arSettings.validation.firstNameRequired,
    lastNameRequired: arSettings.validation.lastNameRequired,
    emailInvalid: arSettings.validation.emailInvalid,
    firstNameTooLong: arSettings.validation.firstNameTooLong,
    lastNameTooLong: arSettings.validation.lastNameTooLong,
    emailTooLong: arSettings.validation.emailTooLong,
};

const valid = { firstName: 'Avery', lastName: 'One', email: 'a@x.yz' };

describe('createProfileSchema (AR-028)', () => {
    it('accepts a valid profile and trims whitespace', () => {
        const parsed = createProfileSchema(enMessages).parse({
            ...valid,
            firstName: '  Avery  ',
        });
        expect(parsed.firstName).toBe('Avery');
    });

    it('renders the English validation messages from the catalog', () => {
        const result = createProfileSchema(enMessages).safeParse({
            firstName: '',
            lastName: '',
            email: 'not-an-email',
        });
        expect(result.success).toBe(false);
        if (result.success) return;

        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages).toContain(enMessages.firstNameRequired);
        expect(messages).toContain(enMessages.lastNameRequired);
        expect(messages).toContain(enMessages.emailInvalid);
    });

    it('renders the Arabic validation messages from the catalog', () => {
        const result = createProfileSchema(arMessages).safeParse({
            firstName: '',
            lastName: 'x'.repeat(81),
            email: 'not-an-email',
        });
        expect(result.success).toBe(false);
        if (result.success) return;

        const messages = result.error.issues.map((issue) => issue.message);
        expect(messages).toContain(arMessages.firstNameRequired);
        expect(messages).toContain(arMessages.lastNameTooLong);
        expect(messages).toContain(arMessages.emailInvalid);
    });

    it('keeps the 80/254 character limits', () => {
        const schema = createProfileSchema(enMessages);
        expect(schema.safeParse({ ...valid, firstName: 'x'.repeat(80) }).success).toBe(true);
        expect(schema.safeParse({ ...valid, firstName: 'x'.repeat(81) }).success).toBe(false);
        expect(schema.safeParse({ ...valid, email: `a@${'x'.repeat(252)}.yz` }).success).toBe(false);
    });
});
