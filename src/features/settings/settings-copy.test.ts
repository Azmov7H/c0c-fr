import { describe, expect, it } from 'vitest';

import arSettings from '../../../messages/ar/settings.json';
import enSettings from '../../../messages/en/settings.json';
import arBilling from '../../../messages/ar/billing.json';
import enBilling from '../../../messages/en/billing.json';
import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';

/**
 * AR-028 — the settings and billing extraction.
 *
 * The same four proofs AR-022…AR-027 made for their surfaces:
 *
 *   1. the SURFACE reads its copy from the catalog — the shared scanner fails
 *      on English still written in the source;
 *   2. the ENGLISH did not change — the catalog carries, verbatim, the
 *      sentences the screens rendered before the extraction;
 *   3. the ARABIC is really Arabic — nothing empty, nothing a copy of its
 *      English counterpart;
 *   4. the PLACEHOLDERS survive the translation — `{plan}`, `{date}`,
 *      `{percent}`, `{count}`, `{period}` are fill-ins, and a sentence that
 *      loses one renders a literal brace.
 */

/** The surface this batch owns. */
const SURFACE = [
    'src/features/settings/components/settings-dashboard.tsx',
    'src/features/settings/components/billing-settings.tsx',
    'src/features/billing/components/billing-status.tsx',
    'src/features/billing/components/usage-summary.tsx',
    'src/features/billing/components/credits-panel.tsx',
    'src/app/[locale]/(dashboard)/settings/page.tsx',
    'src/app/[locale]/(dashboard)/settings/billing/page.tsx',
];

/** Proper nouns are not translated. */
const ALLOWED = ['Stripe', 'C0C'];

type Catalog = typeof enSettings;

/**
 * The English the settings screens rendered BEFORE the extraction (AR-028).
 *
 * This is the regression floor in test form: editing the catalog's English
 * fails this test, so the edit has to be deliberate.
 */
const SETTINGS_FLOOR: Catalog = {
    '@dynamic': enSettings['@dynamic'],
    metadata: {
        title: 'Settings',
        description: 'Manage your profile, workspace configuration, and preferences.',
    },
    header: {
        title: 'System Settings',
        description: 'Manage your account preferences and billing.',
    },
    unknownTab: {
        title: 'Tab not found',
        description:
            'API settings were removed — C0C does not offer a public API. Showing your profile.',
    },
    tabs: {
        profile: 'My Profile',
        security: 'Security',
        logout: 'Logout Instance',
    },
    profile: {
        title: 'Personal Information',
        description: 'Update your public identity on the platform.',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email Address',
        save: 'Save Changes',
    },
    interests: {
        title: 'Interests & personalisation',
        description:
            'The topics and platforms behind your dashboard, trending feed and suggestions.',
        action: 'Update your interests',
    },
    security: {
        passwordTitle: 'Change Password',
        passwordDescription:
            'Update your password. For security this signs you out on every device.',
        sessionsTitle: 'Sessions',
        sessionsDescription: 'Sign out of this device, or everywhere at once.',
        signOut: 'Sign out of this session',
        signOutAll: 'Sign out everywhere',
    },
    validation: {
        firstNameRequired: 'First name is required',
        lastNameRequired: 'Last name is required',
        emailInvalid: 'Enter a valid email address',
        firstNameTooLong: 'First name must be 80 characters or fewer',
        lastNameTooLong: 'Last name must be 80 characters or fewer',
        emailTooLong: 'Email address must be 254 characters or fewer',
    },
    toast: {
        updated: 'Profile updated successfully',
        updateFailed: 'Failed to update profile',
    },
    errors: {
        rateLimit: 'Too many attempts. Wait a moment and try again.',
        sessionExpired: 'Your session has expired. Sign in again.',
        forbidden: 'You do not have permission to do that.',
        notFound: 'We could not find what you were looking for.',
        invalidInput: 'Some fields are invalid. Check them and try again.',
        offline: 'You appear to be offline. Check your connection and try again.',
        server: 'Something went wrong on our side. Try again shortly.',
        generic: 'Failed to update profile',
    },
};

/**
 * The billing English this batch added around the AR-023 copy.
 */
const BILLING_FLOOR = {
    page: {
        metadataTitle: 'Billing & Plan',
        metadataDescription: 'Your current plan, usage and available upgrades.',
        title: 'Billing & Plan',
        description:
            'See what your plan includes and what you have used this period. Upgrades and cancellations are handled by Stripe.',
    },
    status: {
        active: 'Active',
        trialing: 'Trial',
        past_due: 'Payment failed',
        canceled: 'Canceled',
        incomplete: 'Setup incomplete',
        free: 'Free plan',
    },
    currentPlan: {
        label: 'Current plan',
        price: 'Price',
        renews: 'Renews',
        ends: 'Access ends',
        noPeriod: 'No billing period',
        notScheduled: 'Not scheduled',
        billing: 'Billing',
        managedByStripe: 'Managed by Stripe',
        grantedManually: 'Granted manually',
        openingPortal: 'Opening portal…',
        manage: 'Manage subscription',
        starterHint: 'Choose a paid plan below to start a subscription.',
        manualHint:
            'This plan has no Stripe subscription, so there is nothing to manage in the portal.',
        compare: 'Compare paid plans',
    },
    actions: {
        failedTitle: 'Billing action failed',
        inProgress: 'Billing action in progress',
    },
    freeNote:
        'You are within the free limits. Paid plans are optional; upgrade only when a limit is actually in your way.',
    checkout: {
        cancelledTitle: 'Checkout cancelled',
        cancelledDescription: 'You have not been charged and your plan has not changed.',
        dismiss: 'Dismiss',
        confirmedTitle: 'Payment confirmed',
        confirmedDescription: '{plan} is active. Your new limits are shown below.',
        newPlan: 'your new plan',
        processingTitle: 'Your payment is processing',
        processingDescription:
            'Your payment is processing. This page will update shortly. You will not be charged twice if you refresh.',
        refresh: 'Refresh status',
        confirmingTitle: "We're confirming your payment",
        confirmingDescription:
            'Stripe has sent you back, but the payment confirmation can take a few seconds. Your plan will update here as soon as it lands.',
    },
    usage: {
        title: 'Usage this period',
        description:
            'Counters reset automatically at the date shown. Existing work is never deleted when a quota runs out.',
        noCap: 'No cap on this resource.',
        used: '{percent}% used',
        progressLabel: '{label}: {percent}% used',
        resets: 'Resets {date}',
        exhausted: 'Quota reached — generation is paused until reset or upgrade.',
        included: 'Included limits',
        concurrent: 'Concurrent generations',
        endOfPeriod: 'at the end of the period',
    },
    credits: {
        title: 'Monthly credits',
        available: '{count} available',
        fallbackTitle: 'Credits',
        held: '{count} held',
        availableLabel: 'Available',
        inProgress: 'In progress',
        none: 'None',
        cycle: 'Cycle',
        resets: '{period} — resets {date}',
        notScheduled: 'Not scheduled',
        note: 'Generations reserve credits before they run and settle at the actual cost when they finish. If something fails, the reserved credits come back to you.',
        recent: 'Recent activity',
        loading: 'Loading credit activity',
        emptyTitle: 'No credit activity yet',
        emptyDescription:
            'Activity appears here when a generation settles or a new cycle is granted.',
        balance: 'balance {count}',
        amount: 'amount {amount}',
        page: 'Page {page} of {total}',
        newer: 'Newer',
        older: 'Older',
    },
    creditKinds: {
        grant: 'Monthly credit grant',
        topup: 'Top-up pack',
        reserve: 'Reserved for a generation',
        settle: 'Generation charged',
        release: 'Reservation returned',
        refund: 'Refund',
        expiry: 'Unused credits expired',
    },
    errors: {
        rateLimit: 'Too many attempts. Wait a moment and try again.',
        sessionExpired: 'Your session has expired. Sign in again.',
        forbidden: 'You do not have permission to do that.',
        notFound: 'We could not find what you were looking for.',
        invalidInput: 'Some fields are invalid. Check them and try again.',
        offline: 'You appear to be offline. Check your connection and try again.',
        notConfigured:
            'Billing is not configured on this deployment yet. No payment was started.',
        server: 'Something went wrong on our side. Try again shortly.',
        generic: 'Billing could not be started.',
    },
} as const;

function flatten(value: unknown, prefix = ''): Record<string, string> {
    const out: Record<string, string> = {};
    if (typeof value !== 'object' || value === null) return { [prefix]: String(value) };
    for (const [key, child] of Object.entries(value)) {
        if (prefix === '' && key.startsWith('@')) continue;
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholders(value: string): string[] {
    return [...value.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
}

describe('AR-028 the settings and billing extraction', () => {
    it('the surface has no English copy left in the source', () => {
        const leftovers = SURFACE.flatMap((file) =>
            hardcodedCopy(file, { allowed: ALLOWED }).map((text) => `${file}: ${text}`)
        );
        expect(leftovers).toEqual([]);
    });

    it('the English is the copy the screens rendered before the extraction', () => {
        expect(flatten(enSettings)).toEqual(flatten(SETTINGS_FLOOR));

        const billing = flatten(enBilling);
        for (const [key, expected] of Object.entries(flatten(BILLING_FLOOR))) {
            expect(billing[key], `billing.${key}`).toBe(expected);
        }
    });

    it('the Arabic is really Arabic: nothing empty, nothing a copy of the English', () => {
        for (const [name, en, ar] of [
            ['settings', enSettings, arSettings],
            ['billing', enBilling, arBilling],
        ] as const) {
            const english = flatten(en);
            const arabic = flatten(ar);
            expect(Object.keys(arabic).sort(), `${name} keys`).toEqual(
                Object.keys(english).sort()
            );

            for (const [key, value] of Object.entries(arabic)) {
                expect(value, `${name}.${key} is empty`).not.toBe('');
                const sharedByDesign =
                    value.includes('Stripe') ||
                    value.includes('C0C') ||
                    value.includes('API') ||
                    /^[\s,.]*$/.test(value);
                if (!sharedByDesign) {
                    expect(value, `${name}.${key} is the English string`).not.toBe(
                        english[key]
                    );
                }
            }
        }
    });

    it('every placeholder survives the translation', () => {
        for (const [name, en, ar] of [
            ['settings', enSettings, arSettings],
            ['billing', enBilling, arBilling],
        ] as const) {
            const english = flatten(en);
            const arabic = flatten(ar);

            for (const [key, value] of Object.entries(english)) {
                expect(
                    placeholders(arabic[key]),
                    `${name}.${key} placeholders`
                ).toEqual(placeholders(value));
            }
        }
    });

    it('no catalog value uses a bare # (it would switch the digits)', () => {
        for (const catalog of [enSettings, arSettings, enBilling, arBilling]) {
            for (const [key, value] of Object.entries(flatten(catalog))) {
                expect(value, key).not.toMatch(/(^|[^{])#/);
            }
        }
    });
});
