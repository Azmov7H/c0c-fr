export type AudioMood = 'energetic' | 'suspenseful' | 'educational' | 'chill';
export type AudioStatus = 'pending' | 'analyzing' | 'completed' | 'error';

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
    isCurrent: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAudioSuggestionDTO {
    projectId: string;
    mood?: AudioMood;
    musicType?: string;
    status?: AudioStatus;
    scriptId?: string;
    fileUrl?: string;
    durationSeconds?: number;
    format?: AudioAssetFormat;
    fileSize?: number;
    source?: AudioAssetSource;
}

export interface UploadAudioDTO {
    projectId: string;
    scriptId?: string;
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
