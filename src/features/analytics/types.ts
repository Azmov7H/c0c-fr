export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

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
    retentionPrediction: number;
    engagementProbability: number;
    topicCompetition: 'low' | 'medium' | 'high' | 'extreme';
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
}

export interface UpdateAnalyticsDTO extends Partial<CreateAnalyticsDTO> {
    retentionPrediction?: number;
    engagementProbability?: number;
    topicCompetition?: 'low' | 'medium' | 'high' | 'extreme';
    optimizationSuggestions?: string[];
}
