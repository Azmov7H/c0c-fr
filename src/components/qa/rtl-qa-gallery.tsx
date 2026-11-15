'use client';

/**
 * AR-021 — the both-direction QA gallery.
 *
 * One page, two panes: the same primitives, the same components, the same
 * classes — rendered once in `en/ltr` and once in `ar/rtl`, side by side.
 *
 * The point is that the two panes differ in NOTHING but the direction and
 * the copy. A layout that is correct in one pane and broken in the other is
 * a bug that a screenshot in one language can never catch, and an English
 * reviewer can never see.
 *
 * The panes are direction islands: each carries its own `dir` and `lang`, so
 * the CSS logical properties resolve per pane (`me-` follows the pane's
 * direction) and the Arabic typographic rules — the 1.75 line height, the
 * tracking ban — apply to the Arabic pane only.
 *
 * This is a REVIEW artifact (RTL-DESIGN-SYSTEM §9.1): it is never part of the
 * product, and the page that serves it 404s outside development and the E2E
 * stack (see `src/lib/qa-route.ts`).
 */

import { useUrlLocale } from '@/i18n/locale';

import { RTL_QA_SAMPLES } from './rtl-qa-content';
import { RtlQaSections } from './rtl-qa-sections';

function DirectionPane({ direction }: { direction: 'ltr' | 'rtl' }) {
    const text = RTL_QA_SAMPLES[direction === 'rtl' ? 'ar' : 'en'];

    return (
        <section
            dir={direction}
            lang={direction === 'rtl' ? 'ar' : 'en'}
            data-qa-pane={direction}
            aria-label={text.paneTitle}
            className="space-y-6 rounded-2xl border border-border/60 bg-background p-6"
        >
            <header className="space-y-1 border-b border-border/60 pb-4">
                <h2 className="text-lg font-semibold">{text.paneTitle}</h2>
                <p className="text-sm text-muted-foreground">{text.paneNote}</p>
            </header>
            <RtlQaSections text={text} direction={direction} />
        </section>
    );
}

export function RtlQaGallery() {
    // The page chrome follows the locale of the URL; the panes always show
    // BOTH directions, whichever locale the gallery is opened in.
    const locale = useUrlLocale();
    const copy = RTL_QA_SAMPLES[locale];

    return (
        // `<main>`: a document has ONE main landmark, and the gallery is the
        // document's content (axe: `landmark-one-main`).
        <main className="mx-auto w-full max-w-[1800px] space-y-8 px-6 py-8">
            <header className="space-y-2">
                <h1 className="font-display text-3xl font-extrabold tracking-tight">
                    {copy.pageTitle}
                </h1>
                <p className="max-w-3xl text-sm text-muted-foreground">{copy.pageNote}</p>
            </header>
            <div className="grid gap-6 xl:grid-cols-2">
                <DirectionPane direction="ltr" />
                <DirectionPane direction="rtl" />
            </div>
        </main>
    );
}
