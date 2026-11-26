export type ScriptStatus = 'draft' | 'generating' | 'completed' | 'error';
export type SceneTransition = 'cut' | 'fade' | 'dissolve' | 'slide' | 'zoom' | 'none';

/** D5 — the async generation route answers 202 with a durable job handle. */
export interface GenerationJobStart {
    jobId: string;
    status: 'queued';
    projectId: string;
}

export type GenerationJobStatusValue =
    | 'queued'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface GenerationJobStatus {
    jobId: string;
    projectId: string;
    kind: string;
    status: GenerationJobStatusValue;
    scriptId: string | null;
    error: string | null;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
}

export const isGenerationJobStart = (value: unknown): value is GenerationJobStart =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as GenerationJobStart).jobId === 'string' &&
    (value as GenerationJobStart).status === 'queued';

export interface ScriptSection {
    order: number;
    label: string;
    content: string;
    /** Exact voiceover text (empty when the writer left it blank). */
    narration?: string;
    /** What is on screen (empty when not set yet). */
    visualDirection?: string;
    transition?: SceneTransition;
    /** Estimated spoken seconds (0 until generated or filled in). */
    durationSeconds?: number;
    /** Media ids the scene is linked to (wired in P06/P07). */
    assetIds?: string[];
}

export interface Script {
    id: string; // Mongoose returns _id mapped to id conventionally with toJSON transform
    projectId: string;
    userId: string;
    sections: ScriptSection[];
    wordCount: number;
    estimatedTime: string;
    readingLevel: string;
    sentiment: string;
    status: ScriptStatus;
    version: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateScriptDTO {
    projectId: string;
    sections?: ScriptSection[];
    wordCount?: number;
    estimatedTime?: string;
    readingLevel?: string;
    sentiment?: string;
    status?: ScriptStatus;
}

export type UpdateScriptDTO = Partial<CreateScriptDTO>;
