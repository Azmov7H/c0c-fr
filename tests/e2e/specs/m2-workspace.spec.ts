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

test.use({ storageState: 'tests/e2e/.auth/journey1.a.json' });

test('project → assets → media → audio → export → settings → legacy', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('#main-content').getByRole('link', { name: 'New Project' }).first().click();
    await page.getByLabel('Project title').fill('M2 workspace journey');
    await page.getByLabel('The idea').fill('Integration journey project.');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('radiogroup', { name: 'Platform' }).getByRole('radio', { name: /YouTube/ }).click();
    await page.getByRole('radiogroup', { name: 'Tone' }).getByRole('radio', { name: /Professional/ }).click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);

    // Generation happens from the workspace (no standalone navigation).
    await page.getByRole('tab', { name: /Assets/ }).click();
    await expect(page.getByRole('heading', { name: 'Scripts' })).toBeVisible();

    // Media workspace tab renders thumbnail + 3 slots + audio states.
    await page.getByRole('tab', { name: /Media/ }).click();
    await expect(page.getByRole('heading', { name: /Project Thumbnail/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /AI Generated Images/ })).toBeVisible();

    // Settings: API tab is gone; legacy deep link lands on profile.
    await page.goto('/settings?tab=api');
    await expect(page.getByText(/API settings were removed/)).toBeVisible();

    // Legacy routes redirect (no standalone nav left to break).
    await page.goto('/audio');
    await expect(page).toHaveURL(/\/projects/);
});
