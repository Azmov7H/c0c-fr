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
 * P03.1/D9: AI-generated reports are *projections*, not measurements.
 * Live-trend claims ("what is hot right now") are only ever served by the
 * measured snapshot feed below.
 */
export interface TrendReport {
    id: string;
    userId: string;
    platform: Platform;
    source: 'projected';
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

// ─── Measured feed (T07 + P03) ─────────────────────────────────────────────────

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
    /** Niche slug from the onboarding taxonomy; see the backend read-time mapping. */
    category?: string;
}

export interface RankedTrendTopic extends TrendTopic {
    affinity: number;
    matchedInterests: string[];
    matchedPlatforms: string[];
}

export type ProviderStatus = 'ok' | 'stale' | 'unavailable';

export interface TrendFeed {
    scope: TrendScope;
    windowDays: TrendWindow;
    computedAt: string | null;
    fetchedAt: string | null;
    freshness: 'fresh' | 'stale' | 'cold';
    provider: string;
    providerStatus: ProviderStatus;
    source: 'measured';
    topics: TrendTopic[];
}

export interface ForMeTrendFeed {
    scope: TrendScope;
    windowDays: TrendWindow;
    computedAt: string | null;
    fetchedAt: string | null;
    freshness: 'fresh' | 'stale' | 'cold';
    provider: string;
    providerStatus: ProviderStatus;
    source: 'measured';
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
