export type AudioMood = 'energetic' | 'suspenseful' | 'educational' | 'chill';
export type AudioStatus = 'pending' | 'analyzing' | 'completed' | 'error';
export type AudioAssetType = 'narration' | 'sfx' | 'music';

export interface AudioTrack {
    title: string;
    genre: string;
    mood: string;
    bpm: number;
    duration: string;
    url?: string;
}

export interface SfxSuggestion {
    name: string;
    category: string;
    description: string;
}

export interface TimelinePlacement {
    label: string;
    start: string;
    end: string;
}

export type AudioAssetSource = 'generated' | 'uploaded' | 'external';
export type AudioAssetFormat = 'mp3' | 'wav' | 'ogg' | 'm4a';

export interface AudioSuggestion {
    id: string; // From Mongoose
    projectId: string;
    userId: string;
    scriptId?: string;
    mood: AudioMood;
    musicType: string;
    tracks: AudioTrack[];
    sfxSuggestions: SfxSuggestion[];
    timelinePlacements: TimelinePlacement[];
    analysisConfidence: number;
    status: AudioStatus;
    fileUrl?: string;
    durationSeconds?: number;
    format?: AudioAssetFormat;
    fileSize?: number;
    source?: AudioAssetSource;
    /**
     * P06.1: absent on pre-split rows (combined). The narration layer is
     * where playable bytes live; music/sfx carry suggestions + controls.
     */
    assetType?: AudioAssetType;
    volume?: number;
    enabled?: boolean;
    muted?: boolean;
    isCurrent: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

/** P06.1: layer of a row, where legacy rows count as narration. */
export const audioLayerOf = (row: AudioSuggestion): AudioAssetType =>
    row.assetType ?? 'narration';

export interface CreateAudioSuggestionDTO {
    projectId: string;
    mood?: AudioMood;
    musicType?: string;
    status?: AudioStatus;
    scriptId?: string;
    assetType?: AudioAssetType;
    volume?: number;
    enabled?: boolean;
    muted?: boolean;
    fileUrl?: string;
    durationSeconds?: number;
    format?: AudioAssetFormat;
    fileSize?: number;
    source?: AudioAssetSource;
}

export interface UploadAudioDTO {
    projectId: string;
    scriptId?: string;
    assetType?: AudioAssetType;
    fileUrl: string;
    durationSeconds?: number;
    format?: AudioAssetFormat;
    fileSize?: number;
    source?: AudioAssetSource;
}

export interface ReplaceAudioDTO {
    scriptId?: string;
    fileUrl: string;
    durationSeconds?: number;
    format?: AudioAssetFormat;
    fileSize?: number;
}

export interface UpdateAudioSuggestionDTO extends Partial<CreateAudioSuggestionDTO> {
    tracks?: AudioTrack[];
    sfxSuggestions?: SfxSuggestion[];
    timelinePlacements?: TimelinePlacement[];
    analysisConfidence?: number;
}
