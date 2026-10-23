import type { BillingFeature, PlanId } from '../types';

export interface PlanLimits {
    generations: number;
    storageGB: number;
    teamWorkspaces: number | null;
    membersPerProject: number | null;
    concurrentGenerations: number;
}

export interface PlanDefinition {
    id: PlanId;
    name: string;
    audience: string;
    monthlyPriceCents: number;
    currency: 'usd';
    recommendedLabel?: string;
    limits: PlanLimits;
    features: readonly BillingFeature[];
}

export const PLAN_IDS: readonly PlanId[] = ['starter', 'pro', 'studio'];

export const PLAN_CATALOGUE: Record<PlanId, PlanDefinition> = {
    starter: {
        id: 'starter',
        name: 'Starter',
        audience: 'For getting the first videos out.',
        monthlyPriceCents: 0,
        currency: 'usd',
        limits: {
            generations: 50,
            storageGB: 1,
            teamWorkspaces: 1,
            membersPerProject: 1,
            concurrentGenerations: 1,
        },
        features: [
            'ai.generation',
            'teams.create',
            'teams.invite',
            'media.publish',
            'project.members',
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        audience: 'For creators publishing on a schedule.',
        monthlyPriceCents: 4900,
        currency: 'usd',
        recommendedLabel: 'Recommended for weekly publishing',
        limits: {
            generations: 500,
            storageGB: 50,
            teamWorkspaces: 10,
            membersPerProject: 10,
            concurrentGenerations: 3,
        },
        features: [
            'ai.generation',
            'teams.create',
            'teams.invite',
            'media.publish',
            'api.access',
            'project.members',
            'analytics.advanced',
            'export.csv',
        ],
    },
    studio: {
        id: 'studio',
        name: 'Studio',
        audience: 'For teams running multiple channels.',
        monthlyPriceCents: 19900,
        currency: 'usd',
        limits: {
            generations: 2000,
            storageGB: 500,
            teamWorkspaces: null,
            membersPerProject: null,
            concurrentGenerations: 10,
        },
        features: [
            'ai.generation',
            'teams.create',
            'teams.invite',
            'media.publish',
            'api.access',
            'project.members',
            'priority_queue',
            'analytics.advanced',
            'export.csv',
        ],
    },
};

export const FEATURE_LABELS: Record<BillingFeature, string> = {
    'ai.generation': 'AI generations',
    'teams.create': 'Team workspaces',
    'teams.invite': 'Invite collaborators',
    'media.publish': 'Publish media',
    'api.access': 'API access',
    'project.members': 'Project members',
    priority_queue: 'Priority generation queue',
    'analytics.advanced': 'Advanced analytics',
    'export.csv': 'CSV export',
};

export const QUOTA_LABELS: Record<string, string> = {
    'ai.generation': 'AI generations this period',
    'teams.create': 'Team workspaces',
    'project.members': 'Members per project',
    storageGB: 'Storage',
};

const integer = new Intl.NumberFormat('en-US');

export function formatPrice(cents: number, currency: PlanDefinition['currency'] = 'usd'): string {
    if (cents === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

export function formatMonthlyPrice(plan: PlanDefinition): string {
    return plan.monthlyPriceCents === 0
        ? 'Free'
        : `${formatPrice(plan.monthlyPriceCents, plan.currency)}/month`;
}

export function formatLimit(value: number | null, suffix = ''): string {
    if (value === null) return 'Unlimited';
    return `${integer.format(value)}${suffix}`;
}

export function planRank(plan: PlanId): number {
    return PLAN_IDS.indexOf(plan);
}

export function isPaidPlan(plan: PlanId): boolean {
    return PLAN_CATALOGUE[plan].monthlyPriceCents > 0;
}

export function nextPlan(plan: PlanId, direction: 'upgrade' | 'downgrade'): PlanId | null {
    const index = planRank(plan);
    const target = direction === 'upgrade' ? index + 1 : index - 1;
    return PLAN_IDS[target] ?? null;
}

export function planHighlights(plan: PlanDefinition): readonly string[] {
    const highlights = [
        `${integer.format(plan.limits.generations)} AI generations per month`,
        `${plan.limits.storageGB} GB storage`,
        `${formatLimit(plan.limits.membersPerProject)} ${
            plan.limits.membersPerProject === 1 ? 'member' : 'members'
        } per project`,
        `${plan.limits.concurrentGenerations} ${
            plan.limits.concurrentGenerations === 1 ? 'generation' : 'generations'
        } at a time`,
    ];

    if (plan.features.includes('api.access')) highlights.push('API access');
    if (plan.features.includes('analytics.advanced')) highlights.push('Advanced analytics');
    if (plan.features.includes('export.csv')) highlights.push('CSV export');
    if (plan.features.includes('priority_queue')) {
        highlights.push('Priority generation queue', 'Everything in Pro');
    }

    return highlights;
}

export interface ComparisonRow {
    label: string;
    values: Record<PlanId, string>;
}

const included = (value: boolean): string => (value ? 'Included' : 'Not included');

export const PLAN_COMPARISON: readonly ComparisonRow[] = [
    {
        label: FEATURE_LABELS['ai.generation'],
        values: {
            starter: `${integer.format(PLAN_CATALOGUE.starter.limits.generations)} / month`,
            pro: `${integer.format(PLAN_CATALOGUE.pro.limits.generations)} / month`,
            studio: `${integer.format(PLAN_CATALOGUE.studio.limits.generations)} / month`,
        },
    },
    {
        label: 'Storage',
        values: {
            starter: `${PLAN_CATALOGUE.starter.limits.storageGB} GB`,
            pro: `${PLAN_CATALOGUE.pro.limits.storageGB} GB`,
            studio: `${PLAN_CATALOGUE.studio.limits.storageGB} GB`,
        },
    },
    {
        label: FEATURE_LABELS['teams.create'],
        values: {
            starter: formatLimit(PLAN_CATALOGUE.starter.limits.teamWorkspaces),
            pro: formatLimit(PLAN_CATALOGUE.pro.limits.teamWorkspaces),
            studio: formatLimit(PLAN_CATALOGUE.studio.limits.teamWorkspaces),
        },
    },
    {
        label: FEATURE_LABELS['project.members'],
        values: {
            starter: formatLimit(PLAN_CATALOGUE.starter.limits.membersPerProject),
            pro: formatLimit(PLAN_CATALOGUE.pro.limits.membersPerProject),
            studio: formatLimit(PLAN_CATALOGUE.studio.limits.membersPerProject),
        },
    },
    {
        label: 'Concurrent generations',
        values: {
            starter: String(PLAN_CATALOGUE.starter.limits.concurrentGenerations),
            pro: String(PLAN_CATALOGUE.pro.limits.concurrentGenerations),
            studio: String(PLAN_CATALOGUE.studio.limits.concurrentGenerations),
        },
    },
    ...(
        [
            ['teams.invite', 'teams.invite'],
            ['media.publish', 'media.publish'],
            ['api.access', 'api.access'],
            ['analytics.advanced', 'analytics.advanced'],
            ['export.csv', 'export.csv'],
            ['priority_queue', 'priority_queue'],
        ] as const
    ).map(([feature, key]) => ({
        label: FEATURE_LABELS[key],
        values: {
            starter: included(PLAN_CATALOGUE.starter.features.includes(feature)),
            pro: included(PLAN_CATALOGUE.pro.features.includes(feature)),
            studio: included(PLAN_CATALOGUE.studio.features.includes(feature)),
        },
    })),
];

export interface PricingFaqItem {
    question: string;
    answer: string;
}

export const PRICING_FAQ: readonly PricingFaqItem[] = [
    {
        question: 'Do I need a plan to try the product?',
        answer: 'No. Starter is free, needs no card, and includes 50 AI generations every month.',
    },
    {
        question: 'What happens when I reach a quota?',
        answer: 'Generation for that feature stops until the quota resets or you upgrade. Your existing projects and assets stay available.',
    },
    {
        question: 'Can I cancel?',
        answer: 'Yes. Use Manage subscription to cancel in the Stripe Customer Portal. You keep the paid plan until the end of the period you have already paid for.',
    },
    {
        question: 'How do refunds work?',
        answer: 'The Customer Portal does not issue refunds. Contact support and we will review the request against the payment record.',
    },
    {
        question: 'Do you offer annual billing?',
        answer: 'Not yet. Every paid plan is billed monthly.',
    },
];
