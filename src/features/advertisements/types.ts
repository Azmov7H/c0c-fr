export type AdvertisementLanguage = 'ar' | 'en';
export type AdvertisementDirection = 'ltr' | 'rtl';

export type AdvertisementStatus =
    | 'draft'
    | 'ready'
    | 'rendering'
    | 'completed'
    | 'failed'
    | 'archived';

export type RenderJobStatus =
    | 'queued'
    | 'rendering'
    | 'processing-audio'
    | 'finalizing'
    | 'completed'
    | 'failed'
    | 'cancelled';

export type VoiceSource = 'existing' | 'generated' | 'none';

export interface AdvertisementSummary {
    id: string;
    projectId: string;
    projectTitle: string;
    status: AdvertisementStatus;
    contentLanguage: AdvertisementLanguage;
    direction: AdvertisementDirection;
    motionVersion: number;
    hasComposition: boolean;
    durationSec: number | null;
    posterUrl: string | null;
    mp4Url: string | null;
    latestRenderJobId: string | null;
    updatedAt: string;
}

export interface AdvertisementList {
    items: AdvertisementSummary[];
    total: number;
}

export interface AdvertisementRecord {
    id: string;
    projectId: string;
    status: AdvertisementStatus;
    aspectRatio: '16:9';
    contentLanguage: AdvertisementLanguage;
    direction: AdvertisementDirection;
    typographyProfile: string;
    languageSource: 'content-detected' | 'user-confirmed';
    languageConfidence: number;
    languageConfirmed: boolean;
    voiceSource: VoiceSource;
    voiceLanguage: string | null;
    audioAssetId: string | null;
    audioAnalysis: AudioAnalysis | null;
    motionVersion: number;
    compositionHash: string | null;
    motionGeneratedBy: 'ai' | 'fallback' | null;
    motionFallbackReason: string | null;
    renderStale: boolean;
    latestRenderJobId: string | null;
    posterUrl: string | null;
    mp4Url: string | null;
    lastRenderedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AudioSegment {
    sceneId: string;
    text: string;
    startSec: number;
    endSec: number;
    confidence: number;
    timingPrecision: 'word' | 'segment' | 'scene';
}

export interface AudioAnalysis {
    totalDurationSec: number;
    durationSource: 'probe' | 'fallback';
    segments: AudioSegment[];
    wordTimings?: unknown[];
}

export interface MotionKeyframe {
    t: number;
    property: 'opacity' | 'x' | 'y' | 'scale' | 'rotation';
    value: number;
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface MotionLayer {
    id: string;
    type: 'background' | 'image' | 'text' | 'shape' | 'line';
    z: number;
    text?: string;
    role?: 'headline' | 'body' | 'label' | 'caption' | 'badge';
    assetRef?: string;
    assetUrl?: string;
    assetAlt?: string;
    shape?: 'circle' | 'rounded' | 'line' | 'blob';
    position: { x: number; y: number; width: number; height: number };
    style?: {
        color?: string;
        background?: string;
        fontSize?: number;
        fontWeight?: 400 | 500 | 600 | 700 | 800;
        borderRadius?: number;
        opacity?: number;
    };
    transform?: { x: number; y: number; scale: number; rotation: number; opacity: number };
    entrance: 'none' | 'fade' | 'rise' | 'slide-start' | 'slide-end' | 'scale' | 'blur';
    exit: 'none' | 'fade' | 'sink' | 'slide-start' | 'slide-end' | 'scale' | 'blur';
    emphasis: 'none' | 'pulse' | 'float' | 'ken-burns';
    keyframes: MotionKeyframe[];
}

export interface SceneDirectionNotes {
    visualFocus: string;
    narrationRelationship: string;
    sfxCue: string;
}

export interface CreativeDirection {
    version: string;
    visualIdentity: string;
    palette: { colors: string[]; rationale: string };
    typography: {
        profile: 'latin' | 'arabic' | 'mixed';
        treatment: 'precision' | 'guided' | 'editorial';
        rationale: string;
    };
    composition: {
        structure: string;
        backgrounds: string;
        pacing: string;
        animationLanguage: string;
    };
    transitions: {
        primary: 'cut' | 'fade' | 'dissolve' | 'slide' | 'zoom';
        rationale: string;
    };
    narrationRelationship: string;
    sfxPlacement: Array<{
        sceneId: string;
        source: 'voiceover' | 'music' | 'sfx';
        cue: string;
        placement: string;
    }>;
    finalInstructions: string;
    generatedBy: 'ai' | 'fallback';
    fallbackReason?: string;
}

export interface MotionScene {
    sceneId: string;
    sourceSectionId: string;
    intent: string;
    durationSec: number;
    language: AdvertisementLanguage;
    direction: AdvertisementDirection;
    layers: MotionLayer[];
    transitionIn: { type: 'cut' | 'fade' | 'dissolve' | 'slide' | 'zoom'; durationSec: number };
    transitionOut: { type: 'cut' | 'fade' | 'dissolve' | 'slide' | 'zoom'; durationSec: number };
    directionNotes?: SceneDirectionNotes;
}

export interface MotionComposition {
    schemaVersion: string;
    presetLibraryVersion: string;
    promptVersion: string;
    seed: string;
    contentLanguage: AdvertisementLanguage;
    direction: AdvertisementDirection;
    audioAnalysisRef?: { totalDurationSec: number; durationSource: 'probe' | 'fallback' };
    creativeDirection?: CreativeDirection;
    scenes: MotionScene[];
    totalDurationSec: number;
    generatedBy: 'ai' | 'fallback';
    validationIssues?: Array<{ sceneId: string; message: string }>;
}

export interface RenderJobConfig {
    resolution: '720p' | '1080p';
    fps: number;
    aspectRatio: '16:9';
    width: number;
    height: number;
    compositionHash: string;
    watermark: boolean;
}

export interface RenderJob {
    id: string;
    advertisementId: string;
    projectId: string;
    status: RenderJobStatus;
    config: RenderJobConfig;
    progress: {
        percent: number;
        stage: string;
        frame: number;
        totalFrames: number;
    };
    attempt: number;
    maxAttempts: number;
    output: {
        mp4Url?: string;
        posterUrl?: string;
        durationSec?: number;
        bytes?: number;
    } | null;
    error: { code?: string; message?: string; retryable?: boolean } | null;
    cancelRequested: boolean;
    quotaReserved: boolean;
    etaSeconds: number | null;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    failedAt: string | null;
    cancelledAt: string | null;
    downloadUrl: string | null;
}

export interface RenderStartResult {
    job: RenderJob;
    reused: boolean;
    advertisementId: string;
    projectId: string;
}

export interface AdvertisementPlan {
    maxDurationSec: number;
    resolution: '720p' | '1080p';
    fps: number;
    concurrency: number;
    watermark: boolean;
    aspectRatio: '16:9';
}

export interface AdvertisementImage {
    id: string;
    url: string;
    alt: string;
}

export interface AdvertisementDetail {
    advertisement: AdvertisementRecord;
    project: {
        id: string;
        title: string;
        description: string | null;
        idea: string;
        platform: string;
        tone: string;
        status: string;
        contentFormat: string | null;
        durationSeconds: number | null;
        language: string | null;
    };
    script: { id: string; sections: unknown[]; updatedAt: string } | null;
    images: AdvertisementImage[];
    audio: {
        id: string;
        fileUrl: string;
        durationSeconds: number | null;
        format: string | null;
        source: string | null;
    } | null;
    renderJobs: RenderJob[];
    plan: AdvertisementPlan;
    composition: MotionComposition | null;
    language: {
        contentLanguage: AdvertisementLanguage;
        direction: AdvertisementDirection;
        typographyProfile: string;
        source: string;
        confidence: number;
        confirmed: boolean;
        ambiguous: boolean;
    };
}

export interface ProjectVideoState {
    initialized: boolean;
    projectId?: string;
    detail?: AdvertisementDetail;
}

export interface VideoPreview {
    html: string;
    durationSec: number;
    sandbox: string;
}

export interface GenerateVideoResult {
    detail: AdvertisementDetail;
    generatedBy: 'ai' | 'fallback';
    fallbackReason?: string;
}

export interface AdvertisementsQuery {
    page?: number;
    limit?: number;
    status?: AdvertisementStatus | '';
    search?: string;
}
