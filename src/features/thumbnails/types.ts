export type ThumbnailStyle = '3d-render' | 'cinematic' | 'minimalist';
export type ThumbnailStatus = 'pending' | 'generating' | 'completed' | 'error';

export interface Thumbnail {
    id: string; // From Mongoose toJSON transform
    projectId: string;
    userId: string;
    prompt: string;
    stylePreset: ThumbnailStyle;
    colorPalette: string;
    dimensions: { width: number; height: number };
    imageUrl?: string;
    generationTime?: number;
    status: ThumbnailStatus;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateThumbnailDTO {
    projectId: string;
    prompt: string;
    stylePreset?: ThumbnailStyle;
    colorPalette?: string;
    dimensions?: { width: number; height: number };
}

export interface UpdateThumbnailDTO extends Partial<CreateThumbnailDTO> {
    imageUrl?: string;
    status?: ThumbnailStatus;
}
