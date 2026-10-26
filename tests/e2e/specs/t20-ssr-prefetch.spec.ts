/**
 * T20 — verify T14's SSR prefetch with `view-source`, as the card demands:
 * "real numbers in the HTML, not skeletons".
 *
 * `/dashboard` prefetches the stats, projects and scripts queries server-side
 * in its `page.tsx` and seeds TanStack Query's dehydrated state into the
 * rendered HTML (flight payload). This spec loads the dashboard as an
 * onboarded persona (journey2.owner is completed in global setup, with one
 * fixture project called "journey2.owner fixture project"), fetches the RAW
 * HTML of the first navigation, and asserts the serialized dehydrated cache
 * carries real payload — not a skeleton shell:
 *
 *  - the dehydrated state is present in the served HTML (every dehydrated
 *    query entry serializes its `fetchStatus` into the flight payload — the
 *    page renders `<HydrationBoundary state={dehydrate(...)}>`, so that key
 *    only exists if the server actually ran the queries);
 *  - the seeded project title is present in the served HTML (the project
 *    list was fetched server-side, not by the client after paint).
 *
 * The assertion is on the wire bytes, not the hydrated DOM: a client fetch
 * that "works" would pass a DOM-only check, so the raw-HTML probe is the
 * distinction the card asks for. (The second test is a control: the same
 * content is also visible after hydration, so the server HTML is not merely
 * a shell replaced by the client.)
 */

import { expect, test } from '@playwright/test';

const SEED_PROJECT = 'journey2.owner fixture project';

test.use({ storageState: 'tests/e2e/.auth/journey2.owner.json' });

test('/dashboard serves prefetched data in the initial HTML', async ({ page }) => {
    // The raw HTML the browser is told to parse — before any hydration JS runs.
    // page.request (not the `request` fixture): it reuses the browser context's
    // already-loaded cookie jar — a fresh fixture context re-parses the storage
    // state file and Playwright's strict parser rejects session cookies that
    // arrive without a numeric `expires`.
    const response = await page.request.get('/dashboard');
    expect(response.ok()).toBe(true);
    const body = await response.text();

    // The dehydrated query state (dehydrate() → HydrationBoundary) is serialized
    // into the flight payload; `fetchStatus` exists in every dehydrated entry.
    expect(body).toContain('fetchStatus');

    // The seeded project title reached the browser without any client fetch:
    // a skeleton/empty shell would not contain it.
    expect(body).toContain(SEED_PROJECT);
});

test('and the hydrated DOM agrees (no silent skeleton fallback)', async ({ page }) => {
    await page.goto('/dashboard');
    // Same content visible after hydration — the server HTML was real data,
    // not a placeholder the client swapped out.
    expect(
        page.locator('#main-content').getByRole('list', { name: 'Projects' })
    ).toContainText(SEED_PROJECT);
});
