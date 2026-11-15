/**
 * AR-021 — the RTL pass and the axe run, per direction.
 *
 * RTL-DESIGN-SYSTEM §9.3 and §9.4: the Arabic direction needs its OWN
 * verification pass, not a translation of the English one. Three things are
 * checked here, and each of them is something an English reviewer cannot see:
 *
 *   1. the DOCUMENT direction — the server decides it, and the two locales
 *      must disagree about it;
 *   2. the OVERFLOW — an RTL layout that spills past the inline end is
 *      invisible in English, and a horizontal scrollbar on a phone is a
 *      broken page;
 *   3. the AXIOLERABILITY — axe-core, run against the page in EACH
 *      direction. A mirrored layout can break a focus order, a label
 *      association or a heading structure, and axe is the part of the suite
 *      that notices.
 *
 * The gallery (`/qa/rtl`) is the artifact that shows every primitive in both
 * directions at once; the real pages are the artifact that shows the product.
 * Both are checked.
 *
 * axe-core is injected with `page.addScriptTag({ path })` — the `@axe-core/playwright`
 * package is NOT a dependency of this repo, and adding a dependency for one
 * helper would be a bigger change than the helper.
 */

import { expect, test, type Page } from '@playwright/test';

import { E2E_ARABIC_LOCALE, E2E_LOCALE, localePath } from '../harness';

const AXE_SOURCE = require.resolve('axe-core/axe.min.js');

interface AxeViolation {
    id: string;
    impact: string | null;
    help: string;
    nodes: number;
    /** The first offending element — enough to find the bug, short enough to read. */
    target: string;
}

/**
 * The rules that are known and accepted.
 *
 * An empty list would be ideal; a list that is named, reasoned and COUNTED
 * is the honest alternative — the same pattern the repo already uses for the
 * audit advisories (`.audit-exceptions.json`) and the RTL allowlist
 * (`rtl-exceptions.json`).
 *
 * `maxNodes` is the ceiling: a rule that fires on MORE elements than the
 * recorded count fails the test, so the accepted debt may only shrink. The
 * reasons name the decision that causes the violation — they are design
 * decisions, not bugs the suite forgot.
 */
const AXE_EXCEPTIONS: Record<string, { reason: string; maxNodes: number }> = {
    'color-contrast': {
        reason:
            'the muted foreground token does not reach WCAG AA on the card background — a design decision, tracked for the design system, not for this suite',
        maxNodes: 16,
    },
    region: {
        reason:
            'some content sits outside a landmark — the marketing and dashboard shells decide their own landmark structure',
        maxNodes: 3,
    },
    'label-content-name-mismatch': {
        reason:
            'a control shows an icon and an sr-only label; the visible text is not part of the accessible name',
        maxNodes: 4,
    },
    'page-has-heading-one': {
        reason:
            'the page has no h1 in this state — the heading is rendered by the content, which is still English placeholder copy',
        maxNodes: 1,
    },
    'aria-required-children': {
        reason:
            'a tab list without its panels is rendered on the settings page — the panels are behind a client-side gate',
        maxNodes: 1,
    },
};

/** The violations that are neither known nor accepted. */
function unexpected(violations: AxeViolation[]): AxeViolation[] {
    return violations.filter((violation) => {
        const exception = AXE_EXCEPTIONS[violation.id];
        if (!exception) return true;
        return violation.nodes > exception.maxNodes;
    });
}

/** Runs axe-core in the page and returns the violations it found. */
async function runAxe(page: Page): Promise<AxeViolation[]> {
    await page.addScriptTag({ path: AXE_SOURCE });

    return page.evaluate(async () => {
        const axe = (
            window as unknown as {
                axe: {
                    run: (
                        context: Document,
                        options: Record<string, unknown>
                    ) => Promise<{
                        violations: Array<{
                            id: string;
                            impact: string | null;
                            help: string;
                            nodes: Array<{ target: string[] }>;
                        }>;
                    }>;
                };
            }
        ).axe;

        const results = await axe.run(document, { resultTypes: ['violations'] });

        return results.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodes: violation.nodes.length,
            target: violation.nodes[0]?.target.join(' ') ?? '',
        }));
    });
}

/** Does the page spill past the inline end? */
async function horizontalOverflow(page: Page): Promise<number> {
    return page.evaluate(() => {
        const document = window.document.documentElement;
        return document.scrollWidth - document.clientWidth;
    });
}

const DIRECTIONS = [
    { locale: E2E_LOCALE, dir: 'ltr' },
    { locale: E2E_ARABIC_LOCALE, dir: 'rtl' },
] as const;

test.describe('the RTL pass', () => {
    for (const { locale, dir } of DIRECTIONS) {
        test(`the QA gallery renders in ${locale} (${dir})`, async ({ page }) => {
            await page.goto(localePath('/qa/rtl', locale));

            // The gallery shows BOTH directions, whatever the locale of the
            // URL — the panes are direction islands.
            await expect(page.locator('[data-qa-pane="ltr"]')).toBeVisible();
            await expect(page.locator('[data-qa-pane="rtl"]')).toBeVisible();

            // …and the document itself is in the locale of the URL.
            await expect(page.locator('html')).toHaveAttribute('dir', dir);
            await expect(page.locator('html')).toHaveAttribute('lang', locale);

            expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

            const violations = unexpected(await runAxe(page));
            expect(violations, `axe found unexpected violations in ${locale}`).toEqual([]);
        });

        for (const path of ['/', '/login', '/pricing']) {
            test(`the public page ${path} is sound in ${locale} (${dir})`, async ({ page }) => {
                await page.goto(localePath(path, locale));

                await expect(page.locator('html')).toHaveAttribute('dir', dir);

                expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

                const violations = unexpected(await runAxe(page));
                expect(violations, `axe found unexpected violations on ${path} in ${locale}`).toEqual(
                    []
                );
            });
        }
    }
});

test.describe('the authenticated shell', () => {
    // The persona the global setup registered for the M2 workspace journey.
    test.use({ storageState: 'tests/e2e/.auth/journey1.a.json' });

    for (const { locale, dir } of DIRECTIONS) {
        for (const path of ['/dashboard', '/projects', '/settings']) {
            test(`${path} is sound in ${locale} (${dir})`, async ({ page }) => {
                await page.goto(localePath(path, locale));

                await expect(page.locator('html')).toHaveAttribute('dir', dir);

                expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

                const violations = unexpected(await runAxe(page));
                expect(
                    violations,
                    `axe found unexpected violations on ${path} in ${locale}`
                ).toEqual([]);
            });
        }
    }
});
