/**
 * T18 — Journey 3: the negative half of cross-user authorization.
 *
 * A Viewer member gets the same UI the other roles get; the danger is the
 * DIRECT API call, and that is the assertion that does not depend on a hidden
 * control: `PATCH /projects/:id` from the viewer's own session comes back 404
 * (`requireProjectCapability('edit')` throws NotFoundError — ADR-009 masks the
 * project's existence).
 *
 * Journeys 2 and 3 exist BECAUSE two browser contexts are required: the viewer
 * reaches the workspace through their own accept link, with zero shared state.
 */

import { expect, test } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/journey3.owner.json' });

test('viewer cannot edit: control hidden AND direct patch returns 404', async ({
    page,
    browser,
}) => {
    // ── Owner: create the project in the real wizard ────────────────────────
    await page.goto('/projects');
    await page.locator('#main-content').getByRole('link', { name: 'New Project' }).click();
    await page.getByLabel('Project title').fill('Viewer-only review');
    await page.getByLabel('The idea').fill('A project the viewer may read, never mutate.');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .getByRole('radiogroup', { name: 'Platform' })
        .getByRole('radio', { name: /YouTube/ })
        .click();
    await page
        .getByRole('radiogroup', { name: 'Tone' })
        .getByRole('radio', { name: /Professional/ })
        .click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#main-content').getByRole('button', { name: /Create “Viewer-only review”/ }).click();
    await expect(page).toHaveURL(/\/projects\/[a-f\d]{24}$/);
    const projectUrl = page.url();

    // ── Owner: invite someone as viewer ─────────────────────────────────────
    await page.goto(`${projectUrl}?tab=members`);
    await page.getByLabel('Email address').fill('journey3.viewer@t18.e2e.local');
    await page.getByLabel(/Role/).click(); // Select trigger labelled "Role"
    await page.getByRole('option', { name: 'Viewer' }).click();
    await page.getByRole('button', { name: 'Create invite' }).click();

    const acceptUrl = await page.getByLabel('Invite link').inputValue();
    expect(acceptUrl).toMatch(/\/invites\/[a-zA-Z0-9]+/);

    // ── Second context: fresh signup → accept as viewer ─────────────────────
    // `storageState: undefined` must be explicit — a bare `browser.newContext()`
    // inherits this test's owner storageState (journey 2 lesson) and would
    // arrive authenticated as the OWNER.
    const context2 = await browser.newContext({ storageState: undefined });
    const viewer = await context2.newPage();

    await viewer.goto(acceptUrl);
    await viewer.getByRole('link', { name: 'Create an account' }).click();
    await viewer.getByLabel('First Name').fill('Vera');
    await viewer.getByLabel('Last Name').fill('Viewer');
    await viewer.getByLabel('Email Address').fill('journey3.viewer@t18.e2e.local');
    await viewer.getByLabel('Password', { exact: true }).fill('Pl4n9e-Dr1ft-2026!');
    await viewer.getByLabel(/I agree to the Terms/).check();
    await viewer.getByRole('button', { name: 'Create Free Account' }).click();

    await expect(viewer).toHaveURL(/\/onboarding/);
    await viewer
        .getByRole('radiogroup', { name: 'Niche' })
        .getByRole('radio', { name: 'Education & Study' })
        .click();
    await viewer.getByRole('button', { name: 'Continue' }).click();
    const subtopics = viewer.getByRole('group', { name: 'Subtopics' });
    for (const topic of ['Study tips', 'Productivity', 'Career advice']) {
        await subtopics.getByRole('checkbox', { name: topic }).click();
    }
    await viewer.getByRole('button', { name: 'Continue' }).click();
    await viewer
        .getByRole('group', { name: 'Platforms' })
        .getByRole('checkbox', { name: 'YouTube' })
        .click();
    await viewer.getByRole('button', { name: 'Continue' }).click();
    await viewer
        .getByRole('radiogroup', { name: 'Experience level' })
        .getByRole('radio', { name: 'Just starting out' })
        .click();
    await viewer.getByRole('button', { name: 'Continue' }).click();
    await viewer
        .getByRole('group', { name: 'Goals' })
        .getByRole('checkbox', { name: 'Just exploring' })
        .click();
    await viewer.getByRole('button', { name: 'Continue' }).click();
    await viewer.getByRole('button', { name: 'Finish onboarding' }).click();
    await expect(viewer).toHaveURL(/\/dashboard/);

    await viewer.goto(acceptUrl);
    // Card titles (shadcn CardTitle) are <div>, never `heading` roles — assert
    // via text.
    await expect(viewer.getByText(/Join “Viewer-only review”/)).toBeVisible();
    // Confirm the invite honestly names the role.
    await expect(viewer.getByText(/invited you as viewer/i)).toBeVisible();
    await viewer.getByRole('button', { name: 'Accept invite' }).click();
    await expect(viewer.getByText('You are in')).toBeVisible();
    // Same 1.2 s auto-push race as journey 2: click or push — either path lands.
    try {
        await viewer.getByRole('link', { name: 'Open project' }).first().click({ timeout: 1000 });
    } catch (error) {
        if (!(error instanceof Error) || !/time.?out|detach/i.test(error.message)) throw error;
        // auto-push already navigated — the URL assertion below covers it.
    }
    await expect(viewer).toHaveURL(/\/projects\/[a-f\d]{24}$/);

    const viewerProjectUrl = viewer.url();
    const projectId = viewerProjectUrl.split('/').pop() as string;

    // ── The UI hides edit affordances from this role ────────────────────────
    await expect(viewer.getByRole('heading', { name: 'Viewer-only review' })).toBeVisible();
    await expect(viewer.getByRole('button', { name: /Edit project title/ })).toHaveCount(0);
    await expect(
        viewer.getByText('Your role can view assets but not generate or change them.')
    ).toBeVisible();
    const generateButtons = viewer.getByRole('button', { name: 'Generate' });
    const count = await generateButtons.count();
    for (let index = 0; index < count; index += 1) {
        await expect(generateButtons.nth(index)).toBeDisabled();
    }

    // ── The server enforces it too: direct PATCH is a 404 ───────────────────
    // Both the REAL backend origin and the app's same-origin /api/v1 rewrite
    // (the browser's actual delivery path) — either way, no privileged
    // supertest shortcut: the viewer's own cookie jar authenticates both.
    const direct = await viewer.request.fetch(
        `http://localhost:19531/api/v1/projects/${projectId}`, // API_PORT (tests/e2e/harness.ts)
        {
            method: 'PATCH',
            data: { title: 'Viewer overwrote this' },
            headers: { 'content-type': 'application/json' },
        }
    );
    expect(direct.status()).toBe(404);

    const viaAppFetch = await viewer.request.fetch(`http://localhost:19321/api/v1/projects/${projectId}`, {
        method: 'PATCH',
        data: { title: 'Viewer overwrote this too' },
        headers: { 'content-type': 'application/json' },
    });
    expect(viaAppFetch.status()).toBe(404);

    await context2.close();
});
