export type ScriptStatus = 'draft' | 'generating' | 'completed' | 'error';
export type SceneTransition = 'cut' | 'fade' | 'dissolve' | 'slide' | 'zoom' | 'none';

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
