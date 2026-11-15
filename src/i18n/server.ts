/**
 * AR03 — the server-side i18n surface.
 *
 * One import path for the server helpers, so a component never has to know
 * whether a helper comes from `next-intl/server` or from this app's own
 * layer. The functions are re-exported unchanged — this file exists so the
 * app has a stable seam to build on (and a single place to adapt if the
 * library's server API moves).
 *
 * `getTranslations` is the server twin of `useTranslations`; `getFormatter`
 * is the locale-aware formatter that AR02's `src/lib/format/` layer will be
 * built on (FORMATTING-STRATEGY §3).
 */
export {
    getFormatter,
    getLocale,
    getMessages,
    getNow,
    getTimeZone,
    getTranslations,
} from 'next-intl/server';
