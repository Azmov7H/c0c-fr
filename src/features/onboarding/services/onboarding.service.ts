import apiClient from '@/services/api-client';
import { ApiResponse, Platform } from '@/types';

/**
 * Onboarding API client (T13) for T04's endpoints.
 *
 * The taxonomy is never hardcoded here: `getOptions()` is the only source of
 * topics, experience levels and goals. The platform union below is the shared
 * `Platform` type — a schema-level contract, not content.
 */

export interface OnboardingNiche {
    slug: string;
    label: string;
    subtopics: string[];
}

export interface OnboardingChoice {
    value: string;
    label: string;
}

export interface OnboardingStepDef {
    step: number;
    key: string;
    label: string;
}

export interface OnboardingConstraints {
    minSubtopics: number;
    maxSubtopics: number;
    maxInterests: number;
    maxPlatforms: number;
}

export interface OnboardingOptions {
    version: string;
    niches: OnboardingNiche[];
    experienceLevels: OnboardingChoice[];
    goals: OnboardingChoice[];
    steps: OnboardingStepDef[];
    constraints: OnboardingConstraints;
}

export interface OnboardingInterest {
    topic: string;
    weight: number;
}

export interface OnboardingState {
    onboardingCompleted: boolean;
    onboardingStep: number;
    niche: string | null;
    interests: OnboardingInterest[];
    preferredPlatforms: Platform[];
    experience: string | null;
    goals: string[];
}

export interface SaveStepInput {
    niche?: string;
    subtopics?: string[];
    platforms?: Platform[];
    experience?: string;
    goals?: string[];
}

export type SkipReason = 'too_much' | 'not_now' | 'decided_later';

export interface CompleteResult extends OnboardingState {
    seededProjectId: string | null;
}

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'instagram', label: 'Instagram' },
];

export const onboardingService = {
    getOptions: async (): Promise<OnboardingOptions> => {
        const response = await apiClient.get<ApiResponse<OnboardingOptions>>(
            '/users/onboarding/options'
        );
        return response.data.data;
    },

    getState: async (): Promise<OnboardingState> => {
        const response = await apiClient.get<ApiResponse<OnboardingState>>('/users/onboarding');
        return response.data.data;
    },

    saveStep: async (input: SaveStepInput): Promise<OnboardingState> => {
        const response = await apiClient.put<ApiResponse<OnboardingState>>(
            '/users/onboarding',
            input
        );
        return response.data.data;
    },

    complete: async (): Promise<CompleteResult> => {
        const response = await apiClient.post<ApiResponse<CompleteResult>>(
            '/users/onboarding/complete',
            {}
        );
        return response.data.data;
    },

    skip: async (reason?: SkipReason): Promise<OnboardingState> => {
        const response = await apiClient.post<ApiResponse<OnboardingState>>(
            '/users/onboarding/skip',
            reason ? { reason } : {}
        );
        return response.data.data;
    },
};
