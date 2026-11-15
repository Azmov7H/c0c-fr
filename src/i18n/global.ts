import { routing } from './routing';
import common from '../../messages/en/common.json';

/**
 * AR03 — type augmentation for the i18n surface.
 *
 * `Locale` makes every locale typed as `'en' | 'ar'` (not `string`), so a
 * typo in a locale argument is a compile error.
 *
 * `Messages` makes every message key typed from the ENGLISH catalog — the
 * root locale is always complete (I18N-ARCHITECTURE §5), so the English
 * catalog is the type of record. A key that does not exist in `en` cannot be
 * referenced at all, and a key that exists in `en` but not in `ar` is caught
 * by the AR02 parity gate rather than by the compiler.
 *
 * The shape mirrors the runtime exactly: one entry per namespace, each typed
 * from its own file.
 */
declare module 'next-intl' {
    interface AppConfig {
        Locale: (typeof routing.locales)[number];
        Messages: {
            common: typeof common;
        };
    }
}
