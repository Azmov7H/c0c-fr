import type { UserPlan } from '@/types';

export type PlanId = UserPlan;

export type BillingFeature =
    | 'ai.generation'
    | 'teams.create'
    | 'teams.invite'
    | 'media.publish'
    | 'project.members'
    | 'priority_queue'
    | 'analytics.advanced'
    | 'export.csv';

export type SubscriptionStatus =
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'canceled'
    | 'incomplete';

export interface UsageRow {
    feature: string;
    month: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    resetAt: string;
}

export interface BillingSummary {
    plan: PlanId;
    features: BillingFeature[];
    quota: Record<string, number | null>;
    concurrentGenerations: number;
    usage: UsageRow[];
    renewalDate: string | null;
    cancelAtPeriodEnd: boolean;
    status: SubscriptionStatus | null;
    managedByStripe: boolean;
}

/** The server's credit numbers (GET /billing/credits) — never a client estimate. */
export interface CreditBalance {
    balance: number;
    /** Reserved-but-unsettled credits for in-flight operations. */
    held: number;
    /** `YYYY-MM` cycle key this balance belongs to. */
    period: string;
    resetAt: string | null;
    plan: PlanId;
}

export type CreditKind =
    | 'grant'
    | 'topup'
    | 'reserve'
    | 'settle'
    | 'release'
    | 'refund'
    | 'expiry';

/** One immutable ledger row (D7); `amount` is a positive magnitude, `kind` carries direction. */
export interface CreditEvent {
    kind: CreditKind;
    amount: number;
    balanceAfter: number;
    heldAfter: number;
    note?: string;
    createdAt: string;
}

export interface CreditHistoryPage {
    events: CreditEvent[];
    total: number;
    limit: number;
}

export interface CheckoutSession {
    sessionId: string;
    url: string;
    plan: PlanId;
}

export interface PortalSession {
    url: string;
}
