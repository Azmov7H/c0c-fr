/**
 * P12 — the full M3 production path on the real stack.
 *
 * create (with the P04 configuration step) → script → per-scene edit →
 * thumbnail → gallery slots → narration → sound effects → preview (P11) →
 * export (P09: the free allowance, the estimate, the ZIP, the history) →
 * settings (credits panel, the deleted API tab) → legacy redirects.
 *
 * Providers are stubbed at the provider seam (the fake AI server in the
 * harness): the REAL Alibaba client runs, only the network destination is
 * replaced. Storage is unconfigured in the e2e environment, so generated
 * images manifest as provider URLs — the journey asserts the surfaces and
 * the server's own answers, never bytes it cannot really have.
 *
 * Every wait is an assertion with a 20 s budget (playwright.config.ts); no
 * fixed sleeps.
 */

import { expect, test } from '@playwright/test';

import { cardTitle } from '../harness';

test.use({ storageState: 'tests/e2e/.auth/m3.workflow.json' });

test('the M3 path: create with configuration → script → edit → media → layers → preview → export → settings', async ({
    page,
}) => {
    // ── 1. Create the project, INCLUDING the P04 configuration step ───────────
    await page.goto('/projects');
    await page.locator('#main-content').getByRole('link', { name: 'New Project' }).click();
    await page.getByLabel('Project title').fill('P12 workflow journey');
    await page.getByLabel('The idea').fill('A full production path, end to end.');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByRole('radiogroup', { name: 'Platform' }).getByRole('radio', { name: /YouTube/ }).click();
    await page.getByRole('radiogroup', { name: 'Tone' }).getByRole('radio', { name: /Educational/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // P04.3: the format + duration step the M2 journeys never had.
    await page
        .getByRole('radiogroup', { name: 'Content format' })
        .getByRole('radio', { name: /Short-form/ })
        .click();
    await page.getByLabel('Target duration (seconds, optional)').fill('60');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page
        .locator('#main-content')
        .getByRole('button', { name: /Create “P12 workflow journey”/ })
        .click();
    await expect(page).toHaveURL(/\/projects\/[a-f\d]{24}$/);
    const projectUrl = page.url();

    // ── 2. The P11 stepper is on the workspace header ───────────────────────
    const stepper = page.getByRole('navigation', { name: 'Production workflow' });
    await expect(stepper).toBeVisible();
    // The script stage is the first incomplete one; the edit stage is blocked
    // until there is a script to edit.
    await expect(stepper.getByRole('link', { name: 'Script — current step' })).toBeVisible();
    await expect(stepper.getByRole('link', { name: 'Script edit — blocked' })).toBeVisible();

    // ── 3. Generate the script (the fake provider, the real service) ─────────
    await page.getByRole('tab', { name: /Assets/ }).click();
    // A card title is a div with a badge next to it (shadcn's CardTitle) —
    // assert the card title, not a heading role the DOM never had.
    await expect(cardTitle(page, 'Scripts')).toBeVisible();
    await page.getByRole('button', { name: /^Generate$/ }).first().click();
    await expect(page.getByText(/Version 1 · 3 scene\(s\)/)).toBeVisible();

    // ── 4. Edit one scene (P05 per-scene round-trip) ────────────────────────
    await page.locator('#scene-0-content').fill('Edited by the P12 journey.');
    await page.getByRole('button', { name: 'Save script' }).click();
    await expect(page.getByText(/Script scenes \(v2\)/)).toBeVisible();

    // ── 5. The media surfaces: thumbnail, gallery slots, allowance ───────────
    await page.getByRole('tab', { name: /Media/ }).click();
    // Scope to the tab panel: the stepper (in the header) also names stages.
    const media = page.getByRole('tabpanel');
    await expect(cardTitle(media, 'Project Thumbnail')).toBeVisible();
    await expect(cardTitle(media, 'AI Generated Images')).toBeVisible();
    await expect(media.getByText('Slot 1').first()).toBeVisible();
    // P07.6: the server's allowance, on the control.
    await expect(media.getByText(/thumbnail\(s\) used/).first()).toBeVisible();

    // ── 6. The P06 layers: narration and sound effects ──────────────────────
    await expect(cardTitle(media, 'Narration')).toBeVisible();
    await expect(cardTitle(media, 'Sound effects')).toBeVisible();

    await page.getByRole('button', { name: 'Regenerate narration' }).click();
    await expect(media.getByLabel('Narration playback')).toBeVisible();

    // ── 7. The P11 preview stage ────────────────────────────────────────────
    await page.getByRole('tab', { name: /Preview/ }).click();
    const preview = page.getByRole('tabpanel');
    await expect(cardTitle(preview, 'Script')).toBeVisible();
    await expect(preview.getByText('Edited by the P12 journey.')).toBeVisible();
    await expect(preview.getByLabel('Narration playback')).toBeVisible();

    // ── 8. The P09 export: the estimate, the ZIP, the history ───────────────
    await page.getByRole('tab', { name: /Assets/ }).click();
    await expect(page.getByText(/1 of 1 free export left/)).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);

    // The ledger row lands a tick after the ZIP (the settlement is after the
    // response), so the history appears on its own. Scope it to the export
    // panel: the script rows carry their own "completed" status.
    await expect(page.locator('#export').getByText('Completed', { exact: true })).toBeVisible();

    // The stepper now marks the export stage done.
    await page.getByRole('navigation', { name: 'Production workflow' }).getByRole('link', { name: /Export/ }).waitFor();

    // ── 9. Settings: the credits panel and the deleted API tab ──────────────
    await page.goto('/settings/billing');
    await expect(page.getByText('Monthly credits')).toBeVisible();

    await page.goto('/settings?tab=api');
    await expect(page.getByText(/API settings were removed/)).toBeVisible();

    // ── 10. Legacy routes still redirect ────────────────────────────────────
    await page.goto('/audio');
    await expect(page).toHaveURL(/\/projects/);

    // The journey ran on the project it created.
    await page.goto(projectUrl);
    await expect(page.getByRole('navigation', { name: 'Production workflow' })).toBeVisible();
});
