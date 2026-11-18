/**
 * AR-026 — the validation messages the auth schemas speak.
 *
 * The schemas are shared by the BFF routes and by the browser forms, and
 * the messages they carry are USER-FACING: they are what a field shows when
 * the value is wrong. So they are copy, and copy lives in the catalog.
 *
 * The split:
 *
 *   - the FORMS build the bag from the catalog (`features/auth/lib/
 *     validation-messages.ts`) and hand it to the schema factory — the
 *     visitor sees their own language;
 *   - the API ROUTES call the factory without a bag and get the defaults
 *     below — the API is a data boundary, and its 400 body keeps the
 *     English sentences it has always sent (the backend's own messages are
 *     English too; localizing those is the backend's task, AR-036…AR-039).
 *
 * The defaults live here, in ONE place, so the API's messages cannot drift
 * apart from each other.
 */
export interface AuthSchemaMessages {
    invalidEmail: string;
    emailTooLong: string;
    passwordRequired: string;
    passwordTooLong: string;
    passwordTooShort: string;
    passwordNeedsUppercase: string;
    passwordNeedsLowercase: string;
    passwordNeedsDigit: string;
    currentPasswordRequired: string;
    firstNameRequired: string;
    firstNameTooLong: string;
    lastNameRequired: string;
    lastNameTooLong: string;
    invalidLink: string;
}

/** The API's messages — the English sentences the BFF has always sent. */
export const DEFAULT_AUTH_SCHEMA_MESSAGES: AuthSchemaMessages = {
    invalidEmail: 'Invalid email address.',
    emailTooLong: 'Email is too long.',
    passwordRequired: 'Password is required.',
    passwordTooLong: 'Password is too long.',
    passwordTooShort: 'Password must be at least 8 characters.',
    passwordNeedsUppercase: 'Password must contain at least one uppercase letter.',
    passwordNeedsLowercase: 'Password must contain at least one lowercase letter.',
    passwordNeedsDigit: 'Password must contain at least one number.',
    currentPasswordRequired: 'Current password is required.',
    firstNameRequired: 'First name is required.',
    firstNameTooLong: 'First name is too long.',
    lastNameRequired: 'Last name is required.',
    lastNameTooLong: 'Last name is too long.',
    invalidLink: 'This link is invalid.',
};
