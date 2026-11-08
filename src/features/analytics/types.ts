export type ReportPeriod = 'daily' | 'weekly' | 'monthly';
export type ReportSource = 'measured' | 'projected';

export interface PerformanceData {
    day: number;
    value: number;
}

export interface CompetitorVolume {
    topic: string;
    percentage: number;
}

export interface AnalyticsReport {
    id: string;
    projectId: string;
    userId: string;
    /** P01/D9: provenance. Missing (legacy docs) reads as `projected`. */
    source?: ReportSource;
    retentionPrediction: number;
    engagementProbability: number;
    topicCompetition: 'low' | 'medium' | 'high' | 'extreme' | 'unknown';
    performanceData: PerformanceData[];
    competitorVolume: CompetitorVolume[];
    optimizationSuggestions: string[];
    reportPeriod: ReportPeriod;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAnalyticsDTO {
    projectId: string;
    reportPeriod?: ReportPeriod;
    source?: ReportSource;
}

export interface GenerateAnalyticsDTO {
    projectId: string;
    reportPeriod?: ReportPeriod;
    /** Omitted = `measured` (real activity). `projected` = labelled AI opt-in. */
    source?: ReportSource;
}

export interface UpdateAnalyticsDTO extends Partial<CreateAnalyticsDTO> {
    retentionPrediction?: number;
    engagementProbability?: number;
    topicCompetition?: 'low' | 'medium' | 'high' | 'extreme' | 'unknown';
    optimizationSuggestions?: string[];
}
