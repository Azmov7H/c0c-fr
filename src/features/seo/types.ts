export interface SEOAnalysis {
    id: string;
    projectId: string;
    userId: string;
    suggestedTitles: string[];
    description: string;
    hashtags: string[];
    keywords: string[];
    platformScore: number;
    recommendedTags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateSEODTO {
    projectId: string;
}

export interface UpdateSEODTO {
    suggestedTitles?: string[];
    description?: string;
    hashtags?: string[];
    keywords?: string[];
    platformScore?: number;
}
