import type { Metadata } from 'next';

import {
    LegalDocument,
    type LegalSection,
} from '@/features/legal/components/legal-document';
import { getTranslations } from '@/i18n/server';

/**
 * Minimal placeholder, deliberately obvious about it. The footer used to
 * link to a 404; a dead legal link on a SaaS footer is a trust problem
 * (T11 scope note). This page exists so the link resolves, and says what it
 * is: a template awaiting legal review — not a binding policy yet.
 *
 * The [BRACKETED] fields are placeholders. Do not remove the notice until a
 * lawyer has replaced them (tracked in T11-STATUS follow-ups).
 *
 * AR-024: the copy is in the catalog (`messages/{en,ar}/legal.json`), and
 * the metadata is per locale — the page speaks the visitor's language in the
 * search result too.
 */
export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('legal');

    return {
        title: t('privacy.meta.title'),
        description: t('privacy.meta.description'),
    };
}

export default async function PrivacyPage() {
    const t = await getTranslations('legal');

    return (
        <LegalDocument
            title={t('privacy.title')}
            notice={{
                title: t('privacy.notice.title'),
                body: t('privacy.notice.body'),
            }}
            sections={t.raw('privacy.sections') as LegalSection[]}
            governing={t('privacy.governing')}
        />
    );
}
