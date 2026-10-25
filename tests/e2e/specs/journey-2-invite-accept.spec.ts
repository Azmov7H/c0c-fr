/**
 * T18 — Journey 2: invite → accept → contribute.
 *
 * Crosses a real boundary a component test cannot express: the owner creates a
 * project and an invite through the UI, the accept URL is carried to a SECOND
 * browser context (fresh, unauthenticated), where the invitee registers
 * through the real signup form, completes onboarding (the T13 gate runs for
 * them too), returns to the invite link, accepts, and lands in the workspace
 * as an Editor. The invitee then performs a real editor mutation (title edit)
 * that the owner's context sees.
 *
 * Known product UX rough edge, exercised as-is: a freshly-registered invitee
 * gets routed to /onboarding by `postAuthTarget` (callbackUrl is dropped for
 * un-onboarded users), so the journey finishes onboarding before returning to
 * the invite link. The landing on /invites/<token> happens twice because the
 * signup redirect drops the callback — this is what the shipped flow does and
 * the E2E asserts the shipped behavior, not a polite rewrite of it.
 */

import { expect, test } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/journey2.owner.json' });

test('owner invites → invitee accepts in a second context → editor contribution', async ({
    page,
    browser,
}) => {
    // ── Owner: create the project through the real wizard ───────────────────
    await page.goto('/projects');
    // Two "New Project" links exist (page header + inline CTA); scope to the
    // main content so the locator is unique.
    await page.locator('#main-content').getByRole('link', { name: 'New Project' }).click();
    // T15 app shell /projects/new
    await page.getByLabel('Project title').fill('Landing page teardown');
    await page
        .getByLabel('The idea')
        .fill('Review the marketing page copy and tear it apart structurally.');
    await page.getByRole('button', { name: 'Continue' }).click();

    const platformGroup = page.getByRole('radiogroup', { name: 'Platform' });
    await platformGroup.getByRole('radio', { name: /YouTube/ }).click();
    const toneGroup = page.getByRole('radiogroup', { name: 'Tone' });
    await toneGroup.getByRole('radio', { name: /Casual/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.locator('#main-content').getByRole('button', { name: /Create “Landing page teardown”/ }).click();
    await expect(page).toHaveURL(/\/projects\/[a-f\d]{24}$/);
    const projectUrl = page.url();
    const projectId = projectUrl.split('/').pop() as string;

    // ── Owner: invite the collaborator and copy the accept link ─────────────
    await page.goto(`${projectUrl}?tab=members`);
    await page.getByLabel('Email address').fill('journey2.editor@t18.e2e.local');
    await page.getByRole('button', { name: 'Create invite' }).click();

    const inviteLinkInput = page.getByLabel('Invite link');
    await expect(inviteLinkInput).toBeVisible();
    const acceptUrl = await inviteLinkInput.inputValue();
    expect(acceptUrl).toMatch(/\/invites\/[a-zA-Z0-9]+/);

    // ── Second context: the invitee has NO session ──────────────────────────
    // Playwright applies the test's `storageState` option to MANUALLY created
    // contexts too — a bare `browser.newContext()` arrived carrying this test's
    // owner cookie jar and rendered the landing as the already-authenticated
    // OWNER (no "Create an account" link; the click hung). `undefined` must be
    // passed EXPLICITLY to get the genuinely fresh jar the journey needs.
    const context2 = await browser.newContext({ storageState: undefined });
    const invitee = await context2.newPage();

    await invitee.goto(acceptUrl);
    // Public preview: no password reset here — login or signup to continue.
    await invitee.getByRole('link', { name: 'Create an account' }).click();
    await expect(invitee).toHaveURL(/\/signup/);

    await invitee.getByLabel('First Name').fill('Ivo');
    await invitee.getByLabel('Last Name').fill('Editor');
    await invitee.getByLabel('Email Address').fill('journey2.editor@t18.e2e.local');
    await invitee.getByLabel('Password', { exact: true }).fill('Pl4n9e-Dr1ft-2026!');
    await invitee.getByLabel(/I agree to the Terms/).check();
    await invitee.getByRole('button', { name: 'Create Free Account' }).click();

    // T13 gate: the fresh invitee must complete onboarding first.
    await expect(invitee).toHaveURL(/\/onboarding/);
    await invitee
        .getByRole('radiogroup', { name: 'Niche' })
        .getByRole('radio', { name: 'Business & Marketing' })
        .click();
    await invitee.getByRole('button', { name: 'Continue' }).click();
    const subtopics = invitee.getByRole('group', { name: 'Subtopics' });
    for (const topic of ['Startups', 'Freelancing', 'Marketing']) {
        await subtopics.getByRole('checkbox', { name: topic }).click();
    }
    await invitee.getByRole('button', { name: 'Continue' }).click();
    await invitee
        .getByRole('group', { name: 'Platforms' })
        .getByRole('checkbox', { name: 'YouTube' })
        .click();
    await invitee.getByRole('button', { name: 'Continue' }).click();
    await invitee
        .getByRole('radiogroup', { name: 'Experience level' })
        .getByRole('radio', { name: 'Some experience' })
        .click();
    await invitee.getByRole('button', { name: 'Continue' }).click();
    await invitee
        .getByRole('group', { name: 'Goals' })
        .getByRole('checkbox', { name: 'Work for clients' })
        .click();
    await invitee.getByRole('button', { name: 'Continue' }).click();
    await invitee.getByRole('button', { name: 'Finish onboarding' }).click();
    await expect(invitee).toHaveURL(/\/dashboard/); // auto-redirect after completion

    // Return to the same invite link (public page; now authenticated).
    await invitee.goto(acceptUrl);
    // Card titles (shadcn CardTitle) are <div>, never `heading` roles — assert
    // via text.
    await expect(invitee.getByText(/Join “Landing page teardown”/)).toBeVisible();
    await invitee.getByRole('button', { name: 'Accept invite' }).click();
    await expect(invitee.getByText('You are in')).toBeVisible();
    // The accepted card BOTH offers "Open project" and schedules its own push to
    // the project after 1.2 s. Race is fine: either path ends on /projects/:id.
    try {
        await invitee.getByRole('link', { name: 'Open project' }).first().click({ timeout: 1000 });
    } catch (error) {
        if (!(error instanceof Error) || !/time.?out|detach/i.test(error.message)) throw error;
        // auto-push already navigated — the URL assertion below covers it.
    }
    await expect(invitee).toHaveURL(/\/projects\/[a-f\d]{24}$/);
    await expect(
        invitee.getByRole('button', { name: /Edit project title: Landing page teardown/ })
    ).toBeVisible();

    // ── Contribute: the editor performs a real editor mutation ──────────────
    // The title is a BUTTON (`aria-label="Edit project title: …"`), not an h1
    // — h1 with the plain text only renders for roles that cannot edit.
    await expect(
        invitee.getByRole('button', { name: /Edit project title: Landing page teardown/ })
    ).toBeVisible();
    await invitee.getByRole('button', { name: /Edit project title/ }).click();
    await invitee.getByLabel('Project title').fill('Landing page teardown (edited)');
    await invitee.keyboard.press('Enter');
    await expect(
        invitee.getByRole('button', { name: /Edit project title: Landing page teardown \(edited\)/ })
    ).toBeVisible({ timeout: 30_000 });

    // ── Owner sees both facts: the member and the title change ──────────────
    await page.goto(`${projectUrl}?tab=members`);
    await expect(page.getByLabel('Project members')).toContainText('journey2.editor@t18.e2e.local');
    await page.goto(projectUrl);
    await expect(
        page.getByRole('button', { name: /Edit project title: Landing page teardown \(edited\)/ })
    ).toBeVisible();

    await context2.close();
});
