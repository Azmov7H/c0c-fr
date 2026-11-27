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
        promptVersion: 'director.v1',
        seed: 'seed-1',
        contentLanguage: 'ar',
        direction: 'rtl',
        creativeDirection: {
            version: 'direction.v1',
            visualIdentity: 'عرض تقني دقيق لـ«مقاييس الأداء» على يوتيوب',
            palette: {
                colors: ['#0B1220', '#22D3EE', '#F8FAFC', '#CBD5E1'],
                rationale: 'الأزرق السماوي يفصل البيانات عن التعليق على خلفية عميقة.',
            },
            typography: {
                profile: 'arabic',
                treatment: 'precision',
                rationale: 'خط عالي التباين يحافظ على قراءة التسميات والأرقام.',
            },
            composition: {
                structure: 'مفهوم مُسمّى، تفصيل داعم، ثم رابط بصري.',
                backgrounds: 'خلفيات داكنة وهادئة تُبقي الرسوم واضحة.',
                pacing: 'ثبات قصير على الدليل مع كشف أسرع بين الخطوات.',
                animationLanguage: 'انزلاقات وومضات وروابط محسوبة تتبع التعليق.',
            },
            transitions: { primary: 'slide', rationale: 'الانزلاق يُشير إلى خطوة جديدة.' },
            narrationRelationship: 'كل مفهوم يظهر عند بداية مقطعه الصوتي.',
            sfxPlacement: [
                {
                    sceneId: 'scene-1',
                    source: 'sfx',
                    cue: 'نقرة واجهة خفيفة عند التسمية',
                    placement: 'مع ظهور أول تسمية',
                },
            ],
            finalInstructions: 'اعرض فقط الأرقام التي يوفرها النص.',
            generatedBy: 'fallback',
            fallbackReason: 'stubbed provider unavailable',
        },
        scenes: [
            {
                sceneId: 'scene-1',
                sourceSectionId: 'scene-1',
                intent: 'إظهار مقياس زمن الاستجابة',
                durationSec: 5,
                language: 'ar',
                direction: 'rtl',
                layers: [
                    {
                        id: 'layer-background',
                        type: 'background',
                        z: 0,
                        position: { x: 0, y: 0, width: 100, height: 100 },
                        style: { background: '#0B1220' },
                        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
                        entrance: 'none',
                        exit: 'fade',
                        emphasis: 'none',
                        keyframes: [],
                    },
                ],
                transitionIn: { type: 'fade', durationSec: 0.3 },
                transitionOut: { type: 'fade', durationSec: 0.3 },
                directionNotes: {
                    visualFocus: 'إظهار مقياس زمن الاستجابة (rise)',
                    narrationRelationship: 'يظهر المقياس مع بداية المقطع',
                    sfxCue: 'نقرة واجهة خفيفة عند التسمية',
                },
            },
        ],
        totalDurationSec: 5,
        generatedBy: 'fallback',
    };
}
