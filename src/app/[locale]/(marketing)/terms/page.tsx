import type { Metadata } from 'next';

import {
    LegalDocument,
    type LegalSection,
} from '@/features/legal/components/legal-document';
import { getTranslations } from '@/i18n/server';

/**
 * Minimal placeholder — see /privacy for the full reasoning. A dead legal
 * link is worse than an honest placeholder; this page says exactly which it
 * is.
 *
 * AR-024: the copy is in the catalog (`messages/{en,ar}/legal.json`), and
 * the metadata is per locale.
 */
export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('legal');

    return {
        title: t('terms.meta.title'),
        description: t('terms.meta.description'),
    };
}

export default async function TermsPage() {
    const t = await getTranslations('legal');

    return (
        <LegalDocument
            title={t('terms.title')}
            notice={{
                title: t('terms.notice.title'),
                body: t('terms.notice.body'),
            }}
            sections={t.raw('terms.sections') as LegalSection[]}
            governing={t('terms.governing')}
        />
    );
}
