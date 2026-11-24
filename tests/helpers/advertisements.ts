import type {
    AdvertisementDetail,
    AdvertisementSummary,
    MotionComposition,
    RenderJob,
} from '@/features/advertisements/types';

/** Shared wire-shaped fixtures for the advertisement feature's unit tests. */

export function detailFixture(overrides: Partial<AdvertisementDetail> = {}): AdvertisementDetail {
    return {
        advertisement: {
            id: 'ad-1',
            projectId: 'project-1',
            status: 'ready',
            aspectRatio: '16:9',
            contentLanguage: 'ar',
            direction: 'rtl',
            typographyProfile: 'modern',
            languageSource: 'content-detected',
            languageConfidence: 0.92,
            languageConfirmed: true,
            voiceSource: 'none',
            voiceLanguage: null,
            audioAssetId: null,
            audioAnalysis: null,
            motionVersion: 1,
            compositionHash: 'hash-1',
            motionGeneratedBy: 'fallback',
            motionFallbackReason: null,
            renderStale: false,
            latestRenderJobId: null,
            posterUrl: null,
            mp4Url: null,
            lastRenderedAt: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
        },
        project: {
            id: 'project-1',
            title: 'مشروع الاختبار',
            description: null,
            idea: 'فكرة',
            platform: 'youtube',
            tone: 'professional',
            status: 'draft',
            contentFormat: null,
            durationSeconds: 30,
            language: 'ar',
        },
        script: { id: 'script-1', sections: [], updatedAt: '2026-01-01T00:00:00.000Z' },
        images: [],
        audio: null,
        renderJobs: [],
        plan: {
            maxDurationSec: 60,
            resolution: '720p',
            fps: 30,
            concurrency: 1,
            watermark: true,
            aspectRatio: '16:9',
        },
        composition: null,
        language: {
            contentLanguage: 'ar',
            direction: 'rtl',
            typographyProfile: 'modern',
            source: 'content-detected',
            confidence: 0.92,
            confirmed: true,
            ambiguous: false,
        },
        ...overrides,
    };
}

export function summaryFixture(overrides: Partial<AdvertisementSummary> = {}): AdvertisementSummary {
    return {
        id: 'ad-1',
        projectId: 'project-1',
        projectTitle: 'مشروع الاختبار',
        status: 'ready',
        contentLanguage: 'ar',
        direction: 'rtl',
        motionVersion: 1,
        hasComposition: true,
        durationSec: 30,
        posterUrl: null,
        mp4Url: null,
        latestRenderJobId: null,
        updatedAt: '2026-01-02T00:00:00.000Z',
        ...overrides,
    };
}

export function renderJobFixture(overrides: Partial<RenderJob> = {}): RenderJob {
    return {
        id: 'job-1',
        advertisementId: 'ad-1',
        projectId: 'project-1',
        status: 'rendering',
        config: {
            resolution: '720p',
            fps: 30,
            aspectRatio: '16:9',
            width: 1280,
            height: 720,
            compositionHash: 'hash-1',
            watermark: true,
        },
        progress: { percent: 42, stage: 'frames', frame: 378, totalFrames: 900 },
        attempt: 1,
        maxAttempts: 3,
        output: null,
        error: null,
        cancelRequested: false,
        quotaReserved: true,
        etaSeconds: 30,
        createdAt: '2026-01-02T00:00:00.000Z',
        startedAt: '2026-01-02T00:00:05.000Z',
        completedAt: null,
        failedAt: null,
        cancelledAt: null,
        downloadUrl: null,
        ...overrides,
    };
}

export function compositionFixture(): MotionComposition {
    return {
        schemaVersion: 'motion.v1',
        presetLibraryVersion: 'presets.v1',
        promptVersion: 'prompt.v1',
        seed: 'seed-1',
        contentLanguage: 'ar',
        direction: 'rtl',
        scenes: [],
        totalDurationSec: 0,
        generatedBy: 'fallback',
    };
}
