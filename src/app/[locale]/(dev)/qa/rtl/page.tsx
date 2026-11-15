import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isQaRouteEnabled } from '@/lib/qa-route';

/**
 * AR-021 — the both-direction QA gallery.
 *
 * The route is `/[locale]/(dev)/qa/rtl`, so it is served under every locale
 * (`/en/qa/rtl`, `/ar/qa/rtl`) and the `(dev)` group keeps it out of the
 * product's route groups without adding a URL segment.
 *
 * It is a REVIEW artifact (RTL-DESIGN-SYSTEM §9.1) — the page every RTL
 * conversion is checked against — so it is closed by default: `notFound()`
 * everywhere except in development and in the E2E stack (which runs the
 * production build and still has to prove the page renders and passes axe in
 * both directions).
 */
export const metadata: Metadata = {
    title: 'RTL QA',
    // Even an accidental open must not be indexed.
    robots: { index: false, follow: false },
};

/**
 * Dynamic on purpose: the gate is read at REQUEST time, so the SAME build
 * artifact serves the gallery in the E2E job and 404s it in production — no
 * second artifact, and no way to enable it by accident.
 */
export const dynamic = 'force-dynamic';

export default async function RtlQaPage() {
    if (!isQaRouteEnabled()) {
        notFound();
    }

    // Imported only when the gate is open, so the production build never pulls
    // the gallery into this route's graph.
    const { RtlQaGallery } = await import('@/components/qa/rtl-qa-gallery');

    return <RtlQaGallery />;
}
