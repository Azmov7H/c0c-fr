export type Platform = 'youtube' | 'tiktok' | 'instagram';

export interface RisingKeyword {
    keyword: string;
    category: string;
    growth: number;
}

export interface SentimentData {
    positive: number;
    neutral: number;
    negative: number;
}

export interface DemographicLocation {
    city: string;
    percentage: number;
}

/**
 * A user's own AI-generated report. Note that its `viralScore` is a *model
 * projection*, not a measurement — the backend labels these `status`-derived and
 * they live under `/trends/reports`.
 *
 * Distinct from `TrendTopic.viralScore` below, which is a reproducible function
 * of measured counts. The two numbers share a name and nothing else, which is
 * exactly why they are typed apart here rather than sharing an alias.
 */
export interface TrendReport {
    id: string;
    userId: string;
    platform: Platform;
    viralScore: number;
    risingKeywords: RisingKeyword[];
    avgEngagement: number;
    competitionLevel: 'low' | 'medium' | 'high' | 'extreme';
    sentiment: SentimentData;
    demographics: {
        coreAudience: string;
        topLocations: DemographicLocation[];
    };
    status: 'pending' | 'analyzing' | 'completed' | 'error';
    createdAt: string;
    updatedAt: string;
}

export interface CreateTrendDTO {
    platform: Platform;
}

// ─── Measured feed (T07) ────────────────────────────────────────────────────

export type TrendScope = 'global' | Platform;
export type TrendWindow = 7 | 30;

/** Which inputs produced a number. Absence means unmeasured, not zero. */
export type ScoreComponent = 'demand' | 'supply' | 'engagement' | 'velocity';

export interface TrendComponents {
    demand: number;
    supply: number;
    engagement: number;
    velocity: number;
}

export interface TrendTopic {
    topic: string;
    rank: number;
    viralScore: number;
    components: TrendComponents;
    measuredComponents: ScoreComponent[];
    projectCount: number;
    keywordCount: number;
    /** `null` when Analytics has nothing for this topic — not the same as 0. */
    avgEngagement: number | null;
    growthPct: number;
    platforms: string[];
    relatedTopics: string[];
    creatorCount: number;
    source: 'measured';
}

/**
 * A topic as returned by `/trends/for-me`.
 *
 * `affinity` is stated preference, never measurement. It is kept separate from
 * `viralScore` on purpose: merging them would make a personalised ranking
 * impossible to distinguish from a measured one.
 */
export interface RankedTrendTopic extends TrendTopic {
    affinity: number;
    matchedInterests: string[];
    matchedPlatforms: string[];
}

export interface TrendFeed {
    scope: TrendScope;
    windowDays: TrendWindow;
    computedAt: string | null;
    freshness: 'fresh' | 'stale' | 'cold';
    source: 'measured';
    topics: TrendTopic[];
}

export interface ForMeTrendFeed {
    scope: TrendScope;
    windowDays: TrendWindow;
    computedAt: string | null;
    freshness: 'fresh' | 'stale' | 'cold';
    topics: RankedTrendTopic[];
    /** Absent whenever the model failed. Never a placeholder string. */
    summary?: TrendSummary;
}

export interface TrendSummary {
    text: string;
    source: 'projected';
    provider: string;
    model: string;
    generatedAt: string;
}
