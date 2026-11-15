import type { AppLocale } from './routing';

/**
 * AR03 — the message catalog registry.
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

export const NAMESPACES = ['common'] as const;

export type Namespace = (typeof NAMESPACES)[number];

type CatalogModule = { default: Record<string, unknown> };
type CatalogLoader = () => Promise<CatalogModule>;

const CATALOGS: Record<AppLocale, Record<Namespace, CatalogLoader>> = {
    en: {
        common: () => import('../../messages/en/common.json'),
    },
    ar: {
        common: () => import('../../messages/ar/common.json'),
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
