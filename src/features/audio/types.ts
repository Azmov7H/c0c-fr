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

export interface AudioSuggestion {
    id: string; // From Mongoose
    projectId: string;
    userId: string;
    mood: AudioMood;
    musicType: string;
    tracks: AudioTrack[];
    sfxSuggestions: SfxSuggestion[];
    timelinePlacements: TimelinePlacement[];
    analysisConfidence: number;
    status: AudioStatus;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAudioSuggestionDTO {
    projectId: string;
    mood?: AudioMood;
    musicType?: string;
    status?: AudioStatus;
}

export interface UpdateAudioSuggestionDTO extends Partial<CreateAudioSuggestionDTO> {
    tracks?: AudioTrack[];
    sfxSuggestions?: SfxSuggestion[];
    timelinePlacements?: TimelinePlacement[];
    analysisConfidence?: number;
}
