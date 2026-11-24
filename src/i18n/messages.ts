import type { AppLocale } from './routing';

/**
 * AR03/AR10 — the message catalog registry.
 *
 * One file per namespace per locale (`messages/{locale}/{namespace}.json`),
 * exactly as TRANSLATION-GUIDELINES §1 prescribes. The registry below is the
 * single place that knows which namespaces exist: adding a namespace is one
 * line per locale, and the AR02 parity scripts read the SAME list to decide
 * what to compare — a catalog can therefore never exist without being
 * checked, and never be checked without existing.
 *
 * The loaders are static imports on purpose. A dynamic
 * `import(\`../../messages/${locale}/${ns}.json\`)` would work too, but it
 * hides the files from the bundler's static analysis: the standalone output
 * then has to discover them at runtime. Explicit loaders keep every catalog
 * in the build graph (and in `outputFileTracingIncludes`) by construction.
 */

export const NAMESPACES = [
    'common',
    'navigation',
    'landing',
    'auth',
    'pricing',
    'legal',
    'dashboard',
    'projects',
    'advertisements',
    'workspace',
    'scripts',
    'titles',
    'hashtags',
    'audio',
    'thumbnails',
    'media',
    'trends',
    'analytics',
    'planner',
    'seo',
    'team',
    'settings',
    'billing',
    'onboarding',
    'dataState',
    'notifications',
    'errors',
    // Admin Panel (AP-016) — the operations-console catalog.
    'admin',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

type CatalogModule = { default: Record<string, unknown> };
type CatalogLoader = () => Promise<CatalogModule>;

const CATALOGS: Record<AppLocale, Record<Namespace, CatalogLoader>> = {
    en: {
        common: () => import('../../messages/en/common.json'),
        navigation: () => import('../../messages/en/navigation.json'),
        landing: () => import('../../messages/en/landing.json'),
        auth: () => import('../../messages/en/auth.json'),
        pricing: () => import('../../messages/en/pricing.json'),
        legal: () => import('../../messages/en/legal.json'),
        dashboard: () => import('../../messages/en/dashboard.json'),
        projects: () => import('../../messages/en/projects.json'),
        advertisements: () => import('../../messages/en/advertisements.json'),
        workspace: () => import('../../messages/en/workspace.json'),
        scripts: () => import('../../messages/en/scripts.json'),
        titles: () => import('../../messages/en/titles.json'),
        hashtags: () => import('../../messages/en/hashtags.json'),
        audio: () => import('../../messages/en/audio.json'),
        thumbnails: () => import('../../messages/en/thumbnails.json'),
        media: () => import('../../messages/en/media.json'),
        trends: () => import('../../messages/en/trends.json'),
        analytics: () => import('../../messages/en/analytics.json'),
        planner: () => import('../../messages/en/planner.json'),
        seo: () => import('../../messages/en/seo.json'),
        team: () => import('../../messages/en/team.json'),
        settings: () => import('../../messages/en/settings.json'),
        billing: () => import('../../messages/en/billing.json'),
        onboarding: () => import('../../messages/en/onboarding.json'),
        dataState: () => import('../../messages/en/dataState.json'),
        notifications: () => import('../../messages/en/notifications.json'),
        errors: () => import('../../messages/en/errors.json'),
        admin: () => import('../../messages/en/admin.json'),
    },
    ar: {
        common: () => import('../../messages/ar/common.json'),
        navigation: () => import('../../messages/ar/navigation.json'),
        landing: () => import('../../messages/ar/landing.json'),
        auth: () => import('../../messages/ar/auth.json'),
        pricing: () => import('../../messages/ar/pricing.json'),
        legal: () => import('../../messages/ar/legal.json'),
        dashboard: () => import('../../messages/ar/dashboard.json'),
        projects: () => import('../../messages/ar/projects.json'),
        advertisements: () => import('../../messages/ar/advertisements.json'),
        workspace: () => import('../../messages/ar/workspace.json'),
        scripts: () => import('../../messages/ar/scripts.json'),
        titles: () => import('../../messages/ar/titles.json'),
        hashtags: () => import('../../messages/ar/hashtags.json'),
        audio: () => import('../../messages/ar/audio.json'),
        thumbnails: () => import('../../messages/ar/thumbnails.json'),
        media: () => import('../../messages/ar/media.json'),
        trends: () => import('../../messages/ar/trends.json'),
        analytics: () => import('../../messages/ar/analytics.json'),
        planner: () => import('../../messages/ar/planner.json'),
        seo: () => import('../../messages/ar/seo.json'),
        team: () => import('../../messages/ar/team.json'),
        settings: () => import('../../messages/ar/settings.json'),
        billing: () => import('../../messages/ar/billing.json'),
        onboarding: () => import('../../messages/ar/onboarding.json'),
        dataState: () => import('../../messages/ar/dataState.json'),
        notifications: () => import('../../messages/ar/notifications.json'),
        errors: () => import('../../messages/ar/errors.json'),
        admin: () => import('../../messages/ar/admin.json'),
    },
};

/**
 * Loads every namespace for a locale and returns them as ONE nested object.
 *
 * The shape matters: next-intl resolves a message by walking the key by
 * dots (`resolvePath`), so `{ common: { action: { save: '…' } } }` answers
 * `useTranslations('common')('action.save')` — one file per namespace, one
 * lookup per key, no flattening step in the hot path.
 */
export async function loadMessages(locale: AppLocale): Promise<Record<string, unknown>> {
    const catalog = CATALOGS[locale];
    const entries = await Promise.all(
        (Object.keys(catalog) as Namespace[]).map(async (namespace) => {
            const catalogModule = await catalog[namespace]();
            return [namespace, catalogModule.default] as const;
        })
    );
    return Object.fromEntries(entries);
}
