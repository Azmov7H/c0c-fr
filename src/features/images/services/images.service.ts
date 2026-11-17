import apiClient from '@/services/api-client';
import type { PaginatedMeta } from '@/types';

import type { ImageSearchParams, UnsplashPhoto } from '../types';

/**
 * The stock-photo API client.
 *
 * The browser never talks to Unsplash: the access key lives on the server,
 * and these calls go to our own BFF (`/api/v1/images`). That is what the
 * Unsplash guidelines require of a shared key — one proxy, one key, many
 * users — and it is what keeps the key out of the client bundle.
 */
export const imagesService = {
    /** Keyword search with pagination and an orientation filter. */
    async search(params: ImageSearchParams): Promise<{ data: UnsplashPhoto[]; meta: PaginatedMeta }> {
        const { data } = await apiClient.get<{ data: UnsplashPhoto[]; meta: PaginatedMeta }>(
            '/images/search',
            {
                params: {
                    query: params.query,
                    page: params.page,
                    perPage: params.perPage,
                    orientation: params.orientation,
                    orderBy: params.orderBy,
                },
            }
        );
        return { data: data.data, meta: data.meta };
    },

    /**
     * The user picked a photo.
     *
     * The server re-reads the photo from Unsplash (so what is stored is the
     * authoritative record, not something the client could have edited) and
     * records the download event the guidelines require for this action.
     */
    async select(photoId: string): Promise<UnsplashPhoto> {
        const { data } = await apiClient.post<{ data: UnsplashPhoto }>('/images/select', { photoId });
        return data.data;
    },

    /** Records the download event on its own. */
    async trackDownload(photoId: string, downloadLocation?: string): Promise<void> {
        await apiClient.post('/images/download-track', { photoId, downloadLocation });
    },
};
