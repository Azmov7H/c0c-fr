import type { BillingSummary, PlanId } from '../types';

export const CHECKOUT_TARGET_KEY = 'c0c:billing:checkout-target:v1';
export const CHECKOUT_POLL_TIMEOUT_MS = 30_000;
export const CHECKOUT_POLL_INTERVAL_MS = 2_000;

const PAID_PLAN_IDS: readonly PlanId[] = ['pro', 'studio'];
const STRIPE_HOSTS = new Set(['checkout.stripe.com', 'billing.stripe.com']);

export function isPaidPlanId(value: string | null | undefined): value is PlanId {
    return value === 'pro' || value === 'studio';
}

export function saveCheckoutTarget(plan: PlanId): void {
    if (typeof window === 'undefined') return;
    if (!PAID_PLAN_IDS.includes(plan)) return;
    window.sessionStorage.setItem(CHECKOUT_TARGET_KEY, plan);
}

export function readCheckoutTarget(): PlanId | null {
    if (typeof window === 'undefined') return null;
    const value = window.sessionStorage.getItem(CHECKOUT_TARGET_KEY);
    return isPaidPlanId(value) ? value : null;
}

export function clearCheckoutTarget(): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(CHECKOUT_TARGET_KEY);
}

export function isStripeHostedUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && STRIPE_HOSTS.has(url.hostname);
    } catch {
        return false;
    }
}

export function isCheckoutSettled(
    summary: BillingSummary | undefined,
    target: PlanId | null
): boolean {
    if (!summary) return false;
    if (target) return summary.plan === target;
    return summary.plan !== 'starter' && (summary.status === 'active' || summary.status === 'trialing');
}
