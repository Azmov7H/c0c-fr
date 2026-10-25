/**
 * T18 — Journey 1: signup → onboarding → first project.
 *
 * The first E2E this repo has: it crosses *real* boundaries — the public
 * landing page, the signup form through the real BFF register route, the /
 * onboarding gate (T13) enforced by the session initializer, all six wizard
 * steps driving the T04 backend taxonomy, and the seeded draft project (created
 * by the real `complete` handler through the ordinary project service).
 *
 * No fixture user: this script signs up a brand-new persona in the browser,
 * which is the point — a component test cannot catch a cookie-attribute
 * regression or a broken BFF promotion.
 */

import { expect, test } from '@playwright/test';

test.use({ storageState: undefined }); // brand-new visitor; no pre-existing jar

test('landing CTA → signup → onboarding wizard → seeded project', async ({ page }) => {
    // ── Landing → signup ─────────────────────────────────────────────────────
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Start creating/ }).first()).toBeVisible();
    await page.getByRole('link', { name: /Start creating/ }).first().click();
    await expect(page).toHaveURL(/\/signup$/);

    // ── Registration through the real form ──────────────────────────────────
    await page.getByLabel('First Name').fill('Avery');
    await page.getByLabel('Last Name').fill('One');
    await page.getByLabel('Email Address').fill('journey1@t18.e2e.local');
    await page.getByLabel('Password', { exact: true }).fill('Pl4n9e-Dr1ft-2026!');
    await page.getByLabel(/I agree to the Terms/).check();
    await page.getByRole('button', { name: 'Create Free Account' }).click();

    // T13 gate: the brand-new user must land on the wizard, not the dashboard.
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(
        page.getByRole('heading', { name: 'Let us personalise your workspace' })
    ).toBeVisible();

    // ── Step 0: niche (taxonomy served by the backend) ───────────────────────
    const niches = page.getByRole('radiogroup', { name: 'Niche' });
    await expect(niches).toBeVisible();
    await niches.getByRole('radio', { name: 'Tech & Software' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 1: subtopics (3–8) ─────────────────────────────────────────────
    const subtopics = page.getByRole('group', { name: 'Subtopics' });
    await expect(subtopics).toBeVisible();
    for (const topic of ['AI & ML', 'Web development', 'Mobile apps']) {
        await subtopics.getByRole('checkbox', { name: topic }).click();
    }
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 2: platforms (1–3) ─────────────────────────────────────────────
    const platforms = page.getByRole('group', { name: 'Platforms' });
    await platforms.getByRole('checkbox', { name: 'YouTube' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 3: experience ───────────────────────────────────────────────────
    const experience = page.getByRole('radiogroup', { name: 'Experience level' });
    await experience.getByRole('radio', { name: 'Just starting out' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 4: goals ────────────────────────────────────────────────────────
    const goals = page.getByRole('group', { name: 'Goals' });
    await goals.getByRole('checkbox', { name: 'Grow my audience' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Step 5: review → complete ────────────────────────────────────────────
    // Review panel's h2 carries the taxonomy step label. Card §4: the final
    // indicator reads "Finish" (last progress paragraph is 'Finish'/' 6/6'),
    // NOT "Step 6 of 6" — a 'Finish' text match would collide with both the
    // progress rail and the "Finish onboarding" button, so assert '6/6'.
    await expect(page.getByRole('heading', { name: 'Review your choices' })).toBeVisible();
    await expect(page.getByText('6/6')).toBeVisible();
    // Row labels render as <dt>; each Edit button also carries an sr-only copy
    // of the same string, so a page-wide getByText(row, { exact: true }) is a
    // strict-mode violation (2 matches) — scope to the definition list.
    for (const row of ['Niche', 'Subtopics', 'Platforms', 'Experience', 'Goals']) {
        await expect(page.locator('dl dt', { hasText: row })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Finish onboarding' }).click();

    await expect(page.getByRole('heading', { name: 'Your first draft project is ready' })).toBeVisible();

    // ── The seeded project exists and is reachable ───────────────────────────
    await page.getByRole('link', { name: 'Open my first project' }).click();
    await expect(page).toHaveURL(/\/projects\/[a-f\d]{24}$/);
    // A fresh signup owns the project (may edit): the title is the
    // `aria-label="Edit project title: …"` BUTTON, not an h1. The seeded title
    // is derived from the taxonomy pick (first selected subtopic), not a fixed
    // literal — extract it once and reuse it for the dashboard assertion.
    const titleButton = page.getByRole('button', { name: /Edit project title: My first .* project/ });
    await expect(titleButton).toBeVisible();
    const ariaLabel = await titleButton.getAttribute('aria-label');
    const seededTitle = (ariaLabel ?? '').replace(/^Edit project title: /, '');
    expect(seededTitle).toMatch(/^My first .+ project$/);

    // ── The dashboard surfaces it too (T14 projects widget) ─────────────────
    // The widget heading is ALSO named "Projects" — scope by unique role+name
    // to the labelled list itself, inside the main content region.
    await page.goto('/dashboard');
    await expect(
        page.locator('#main-content').getByRole('list', { name: 'Projects' })
    ).toContainText(seededTitle);
    await expect(page.getByRole('link', { name: 'Resume' })).toBeVisible();
});
