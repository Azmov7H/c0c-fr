import type { UserPlan } from '@/types';

export type PlanId = UserPlan;

export type BillingFeature =
    | 'ai.generation'
    | 'teams.create'
    | 'teams.invite'
    | 'media.publish'
    | 'api.access'
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

export interface CheckoutSession {
    sessionId: string;
    url: string;
    plan: PlanId;
}

export interface PortalSession {
    url: string;
}
