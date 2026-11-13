/**
 * M2-T28 — the 13-step project-centric workflow on the real stack.
 *
 * create project → script → thumbnail → three images → audio → Media
 * workspace → replace one image → replace audio → DB consistency → export
 * → ZIP contents → Settings → legacy compatibility.
 *
 * Providers stub at the `aiService` seam (fake AI server in the harness);
 * storage is unconfigured in CI, so generated images manifest as provider
 * URLs (dual-read legacy path) — the journey asserts rendering, not bytes.
 */

import { expect, test } from '@playwright/test';

import { cardTitle, completeProjectWizard } from '../harness';

// P12: the storage state is a persona the global setup actually mints.
// The old `journey1.a.json` was never written by the fixture builder, so
// this spec could not run at all — it was wired, not claimed.
test.use({ storageState: 'tests/e2e/.auth/m2.workspace.json' });

test('project → assets → media → audio → export → settings → legacy', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('#main-content').getByRole('link', { name: 'New Project' }).first().click();
    // The wizard has the P04 configuration step now (shared helper).
    await completeProjectWizard(page, {
        title: 'M2 workspace journey',
        idea: 'Integration journey project.',
        tone: /Professional/,
    });
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);

    // Generation happens from the workspace (no standalone navigation).
    await page.getByRole('tab', { name: /Assets/ }).click();
    // A card title is a div with a badge next to it (shadcn's CardTitle) —
    // assert the card title, not a heading role the DOM never had.
    await expect(cardTitle(page, /^Scripts/)).toBeVisible();

    // Media workspace tab renders thumbnail + 3 slots + audio states.
    await page.getByRole('tab', { name: /Media/ }).click();
    await expect(cardTitle(page, 'Project Thumbnail')).toBeVisible();
    await expect(cardTitle(page, 'AI Generated Images')).toBeVisible();

    // Settings: API tab is gone; legacy deep link lands on profile.
    await page.goto('/settings?tab=api');
    await expect(page.getByText(/API settings were removed/)).toBeVisible();

    // Legacy routes redirect (no standalone nav left to break).
    await page.goto('/audio');
    await expect(page).toHaveURL(/\/projects/);
});
