/**
 * T18 — Journey 4: quota → upgrade → quota increases → generation succeeds.
 *
 * Structure per the card's rules — "never depend on a real Stripe sandbox
 * round trip; mock at the webhook boundary, not at the SDK; never a live API
 * key":
 *
 *   - the AI provider the backend really calls is a local OpenAI-compatible
 *     stub (the Alibaba client runs unchanged; `ALIBABA_BASE_URL` is the only
 *     replaced leg), so "generation succeeds" exercises the REAL consumer code;
 *   - the starter `ai.generation` allowance is exhausted through REAL
 *     `/scripts/generate` calls from the owner's own browser session — the
 *     same entitlement middleware the UI hits; the count is driven by the
 *     returned 429, not a guessed number;
 *   - the in-app Generate button then renders the shipped UpgradePrompt;
 *   - the upgrade arrives the way it really does — as signed Stripe webhooks —
 *     except the DELIVERY leg (which in test mode requires `stripe listen`)
 *     is simulated locally: a signed `checkout.session.completed` event goes
 *     to the backend's real webhook endpoint, whose signature verification,
 *     idempotency ledger and subscription sync all run for real;
 *   - after a reload the SAME button succeeds.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';
import { deliverStripeEvent, stripeEvent } from '../harness';

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

test.use({ storageState: 'tests/e2e/.auth/journey4.owner.json' });

test('starter quota exhausts → upgrade webhook lands → pro generation succeeds', async ({
    page,
}) => {
    const staged = FIXTURES.personas['journey4.owner'];

    // ── Exhaust the starter ai.generation allowance through the real backend ─
    // page.request shares the persona's browser cookie jar, so these go over
    // the same origin + credentials the app's own axios calls use.
    let attempts = 0;
    for (;;) {
        attempts += 1;
        if (attempts > 60) throw new Error('quota was not exhausted within 60 attempts');
        const response = await page.request.post(
            // API_PORT from tests/e2e/harness.ts
            'http://localhost:19531/api/v1/scripts/generate',
            { data: { projectId: staged.projectId } }
        );
        if (response.status() === 429) break;
        if (!response.ok) {
            throw new Error(`unexpected ${response.status()} on generation attempt ${attempts}`);
        }
    }

    // ── In-app: the exhausted quota is visible in the shipped UI ─────────────
    await page.goto(`/projects/${staged.projectId}`);
    const quotaClick = page.waitForResponse(
        (res) => res.url().includes('/scripts/generate'),
        { timeout: 20_000 }
    );
    await page.getByRole('button', { name: 'Generate', exact: true }).first().click();
    const quotaResponse = await quotaClick;
    // Backend truth first: the habit must be the QUOTA limiter's 429, not the
    // API limiter's.
    expect(quotaResponse.status()).toBe(429);
    await expect(page.getByText('Generation quota reached')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Upgrade for more generations' })).toBeVisible();

    // ── The upgrade arrives as real signed Stripe webhooks ───────────────────
    const webhook = await deliverStripeEvent(
        stripeEvent(`evt_t18_j4_checkout_${Date.now()}`, 'checkout.session.completed', {
            id: `cs_t18_j4_${Date.now()}`,
            customer: 'cus_t18_j4',
            subscription: 'sub_t18_j4',
            status: 'complete',
            metadata: { userId: staged.persona.id, plan: 'pro' },
        })
    );
    expect(webhook.status).toBe(200);
    expect(webhook.received).toBe(true);
    expect(webhook.handled).toBe(true);

    // ── Same UI path that just failed now succeeds ──────────────────────────
    await page.reload();
    const success = page.waitForResponse(
        (res) => res.url().includes('/api/v1/scripts/generate') && res.status() === 201
    );
    await page.getByRole('button', { name: 'Generate', exact: true }).first().click();
    expect((await success).status()).toBe(201);
});
