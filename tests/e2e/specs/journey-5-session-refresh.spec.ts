/**
 * T18 — Journey 5: session expiry → silent refresh → the user never sees a
 * login screen.
 *
 * Expiry is FORCED, not waited on: the test mints a correctly-signed access
 * token whose `exp` is already in the past (same issuer/audience/`typ`
 * contract as the backend) and swaps it into the cookie jar mid-session. That
 * makes the journey deterministic; there is no wall-clock tolerance in it.
 *
 * The trigger is an in-page mutation — the workspace title rename — which is
 * a plain axios call, NOT a navigation: middleware never gets a chance to
 * bounce the user, and the refresh flow (single flight, cookie rotation) is
 * observable through the response listener. The user ends the journey still
 * on the same protected URL, holding a freshly-minted session cookie, with
 * the rename applied server-side.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';
import { mintExpiredAccessToken } from '../harness';

interface FixturePersona {
    id: string;
    email: string;
}

interface FixtureFile {
    personas: Record<string, { persona: FixturePersona; projectId: string }>;
}

const FIXTURES: FixtureFile = JSON.parse(
    readFileSync(path.resolve(process.cwd(), 'tests', 'e2e', 'fixtures.json'), 'utf8')
);

test.use({ storageState: 'tests/e2e/.auth/journey5.owner.json' });

test('expired access token silently refreshes mid-session', async ({ page, context }) => {
    const staged = FIXTURES.personas['journey5.owner'];
    const projectUrl = `/projects/${staged.projectId}`;

    // Valid session; land on a page that performs axios calls (the workspace).
    await page.goto(projectUrl);
    // The workspace title is a BUTTON (`aria-label="Edit project title: …"`)
    // for roles that may edit — not an h1 heading.
    await expect(
        page.getByRole('button', { name: /Edit project title: .+ fixture project/ })
    ).toBeVisible();

    // Watch ONLY the in-page refresh request; a redirect to /login would be a
    // journey failure (it is precisely the wall this journey exists to disprove).
    let refreshCount = 0;
    page.on('response', (response) => {
        if (response.url().includes('/api/auth/refresh') && response.request().method() === 'POST') {
            refreshCount += 1;
        }
    });

    // Force expiry: swap the session cookie for a signed-but-expired one.
    const expired = await mintExpiredAccessToken(staged.persona);
    await context.addCookies([expired]);

    // Attach the deterministic waiter BEFORE triggering: the listener above
    // counts on arrival, but "response arrived" and "listener ran" are not the
    // same instant — asserting the count right after a UI state change raced
    // the event dispatch in one run (rename visible, count still 0). The waiter
    // only resolves after the refresh response EXISTS.
    const refreshDone = page.waitForResponse(
        (response) =>
            response.url().includes('/api/auth/refresh') && response.request().method() === 'POST'
    );

    // Trigger the real in-app axios call: rename writes PATCH /projects/:id.
    const renamed = 'Renamed after silent refresh';
    await page.getByRole('button', { name: /Edit project title/ }).click();
    await page.getByLabel('Project title').fill(renamed);
    await page.keyboard.press('Enter');

    const refresh = await refreshDone;
    expect(refresh.status()).toBe(200);
    // Retry succeeded: the rename is visible AND durable (fresh render from the
    // project refetch), still on the protected URL, never seeing /login.
    await expect(
        page.getByRole('button', { name: /Edit project title: Renamed after silent refresh/ })
    ).toBeVisible();
    expect(refreshCount).toBe(1); // single-flight: exactly one refresh served every retry
    expect(page.url()).not.toContain('/login');
});
