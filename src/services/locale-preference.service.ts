import { isAppLocale, type AppLocale } from '@/i18n/routing';
import apiClient from '@/services/api-client';

/**
 * AR-039 — the authenticated locale preference, through the BFF.
 *
 * AR-036 added `GET/PATCH /users/profile/preferences/locale` additively; this
 * is the browser-side adapter for that contract. `dashboardPreferences`
 * remains a separate endpoint and is untouched.
 *
 * A malformed envelope is an error, not a silent `en`: login reconciliation
 * must not invent a DB value the account never stored. Callers that can
 * tolerate an unavailable preference (the session initializer, the switcher)
 * catch the error and keep the locale they already have.
 */
const LOCALE_PREFERENCE_PATH = '/users/profile/preferences/locale';

interface LocaleEnvelope {
    data?: { locale?: unknown };
}

export const localePreferenceService = {
    async get(): Promise<AppLocale> {
        const { data } = await apiClient.get<LocaleEnvelope>(LOCALE_PREFERENCE_PATH);
        const locale = data?.data?.locale;
        if (!isAppLocale(locale)) {
            throw new Error('Invalid locale preference response');
        }
        return locale;
    },

    async update(locale: AppLocale): Promise<AppLocale> {
        const { data } = await apiClient.patch<LocaleEnvelope>(LOCALE_PREFERENCE_PATH, { locale });
        const effective = data?.data?.locale;
        if (!isAppLocale(effective)) {
            throw new Error('Invalid locale preference response');
        }
        return effective;
    },
};
