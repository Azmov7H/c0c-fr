// ─── User Types ────────────────────────────────────────
export type UserRole = 'user' | 'admin';
export type UserPlan = 'starter' | 'pro' | 'studio';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: UserRole;
    plan: UserPlan;
    createdAt: string;
    updatedAt: string;
}

// ─── Project Types ─────────────────────────────────────
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'archived';
export type Platform = 'youtube' | 'tiktok' | 'instagram';
export type ContentTone = 'educational' | 'dramatic' | 'viral' | 'storytelling' | 'casual' | 'professional';

export interface Project {
    _id: string;
    title: string;
    description?: string;
    idea: string;
    platform: Platform;
    tone: ContentTone;
    status: ProjectStatus;
    userId: string;
    thumbnailUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// ─── Script Types ──────────────────────────────────────
export type ScriptStatus = 'draft' | 'generating' | 'completed' | 'error';

export interface ScriptSection {
    order: number;
    label: string;
    content: string;
}

export interface Script {
    _id: string;
    projectId: string;
    userId: string;
    sections: ScriptSection[];
    wordCount: number;
    estimatedTime: string;
    readingLevel: string;
    sentiment: string;
    status: ScriptStatus;
    version: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Thumbnail Types ───────────────────────────────────
export type ThumbnailStyle = '3d-render' | 'cinematic' | 'minimalist';

export interface Thumbnail {
    _id: string;
    projectId: string;
    userId: string;
    prompt: string;
    stylePreset: ThumbnailStyle;
    colorPalette: string;
    dimensions: { width: number; height: number };
    imageUrl?: string;
    generationTime?: number;
    status: 'pending' | 'generating' | 'completed' | 'error';
    createdAt: string;
    updatedAt: string;
}

// ─── Audio Types ───────────────────────────────────────
export type AudioMood = 'energetic' | 'suspenseful' | 'educational' | 'chill';

export interface AudioTrack {
    title: string;
    genre: string;
    mood: string;
    bpm: number;
    duration: string;
    url?: string;
}

export interface AudioSuggestion {
    _id: string;
    projectId: string;
    mood: AudioMood;
    musicType: string;
    tracks: AudioTrack[];
    sfxSuggestions: { name: string; category: string; description: string }[];
    analysisConfidence: number;
    status: 'pending' | 'analyzing' | 'completed' | 'error';
    createdAt: string;
    updatedAt: string;
}

// ─── Trend Types ───────────────────────────────────────
export interface RisingKeyword {
    keyword: string;
    category: string;
    growth: number;
}

export interface TrendReport {
    _id: string;
    userId: string;
    platform: Platform;
    viralScore: number;
    risingKeywords: RisingKeyword[];
    avgEngagement: number;
    competitionLevel: string;
    sentiment: { positive: number; neutral: number; negative: number };
    demographics: {
        coreAudience: string;
        topLocations: { city: string; percentage: number }[];
    };
    createdAt: string;
    updatedAt: string;
}

// ─── API Response Types ────────────────────────────────
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: PaginatedMeta;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

// ─── Auth Types ────────────────────────────────────────
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
}
