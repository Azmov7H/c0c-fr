import type { UnsplashPhoto } from '@/features/images/types';

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
    /** The provenance of the image (for a stock photo: the photographer). */
    metadata?: Record<string, unknown>;
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
    /**
     * The photo the user picked with the Unsplash picker. The concept is
     * still written by the AI — only the picture comes from Unsplash.
     */
    image?: UnsplashPhoto;
}

export interface UpdateThumbnailDTO extends Partial<CreateThumbnailDTO> {
    imageUrl?: string;
    status?: ThumbnailStatus;
}
