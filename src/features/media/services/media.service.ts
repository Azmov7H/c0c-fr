import apiClient from '@/services/api-client';

export interface MediaItem {
    _id: string;
    userId: string;
    projectId?: string;
    title: string;
    description?: string;
    category: 'image' | 'video' | 'audio' | 'document';
    source: 'upload' | 'generated' | 'external';
    mimeType: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
    tags?: string[];
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export const mediaService = {
    async getMedia(params?: {
        page?: number;
        limit?: number;
        category?: string;
        projectId?: string;
        search?: string;
    }): Promise<{ data: MediaItem[]; meta: any }> {
        const { data } = await apiClient.get('/media', { params });
        return { data: data.data, meta: data.meta };
    },

    async getById(id: string): Promise<MediaItem> {
        const { data } = await apiClient.get(`/media/${id}`);
        return data.data;
    },

    async create(dto: Partial<MediaItem>): Promise<MediaItem> {
        const { data } = await apiClient.post('/media', dto);
        return data.data;
    },

    async update(id: string, dto: Partial<MediaItem>): Promise<MediaItem> {
        const { data } = await apiClient.patch(`/media/${id}`, dto);
        return data.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/media/${id}`);
    },

    async getStats(): Promise<{ total: number }> {
        const { data } = await apiClient.get('/media/stats');
        return data.data;
    },
};
