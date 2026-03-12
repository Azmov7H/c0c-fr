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
