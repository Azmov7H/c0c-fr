import type { useTranslations } from 'next-intl';

import { PASSWORD_MIN_LENGTH } from '@/lib/password-policy';
import type { AuthSchemaMessages } from '@/lib/auth-schema-messages';

/**
 * AR-026 — the validation copy, in the visitor's language.
 *
 * The schemas are shared by the API and the browser; their messages are
 * copy, so the browser hands them the catalog's version and the API keeps
 * the English defaults (`@/lib/auth-schema-messages`).
 *
 * The translator's type is next-intl's own, so a key that does not exist in
 * the catalog is a TYPE ERROR.
 */
export type AuthTranslator = ReturnType<typeof useTranslations<'auth'>>;

/** The messages the API schemas speak. */
export interface AuthFormMessages {
    /** The bag the schema factories take. */
    schema: AuthSchemaMessages;
    /** The rules only the forms have. */
    confirmPasswordRequired: string;
    passwordsMismatch: string;
    termsRequired: string;
}

/** Builds the validation messages from the catalog. */
export function authFormMessages(t: AuthTranslator): AuthFormMessages {
    return {
        schema: {
            invalidEmail: t('validation.invalidEmail'),
            emailTooLong: t('validation.emailTooLong'),
            passwordRequired: t('validation.passwordRequired'),
            passwordTooLong: t('validation.passwordTooLong'),
            passwordTooShort: t('validation.passwordTooShort', {
                count: PASSWORD_MIN_LENGTH,
            }),
            passwordNeedsUppercase: t('validation.passwordNeedsUppercase'),
            passwordNeedsLowercase: t('validation.passwordNeedsLowercase'),
            passwordNeedsDigit: t('validation.passwordNeedsDigit'),
            currentPasswordRequired: t('validation.currentPasswordRequired'),
            firstNameRequired: t('validation.firstNameRequired'),
            firstNameTooLong: t('validation.firstNameTooLong'),
            lastNameRequired: t('validation.lastNameRequired'),
            lastNameTooLong: t('validation.lastNameTooLong'),
            invalidLink: t('validation.invalidLink'),
        },
        confirmPasswordRequired: t('validation.confirmPasswordRequired'),
        passwordsMismatch: t('validation.passwordsMismatch'),
        termsRequired: t('validation.termsRequired'),
    };
}
