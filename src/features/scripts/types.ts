export type ScriptStatus = 'draft' | 'generating' | 'completed' | 'error';

export interface ScriptSection {
    order: number;
    label: string;
    content: string;
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

export interface UpdateScriptDTO extends Partial<CreateScriptDTO> { }
