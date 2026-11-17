import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';
import { imagesService } from '../services/images.service';
import type { UnsplashOrientation, UnsplashPhoto } from '../types';

export const imagesKeys = {
    all: ['images'] as const,
    search: () => [...imagesKeys.all, 'search'] as const,
    searchFor: (params: { query: string; orientation?: UnsplashOrientation }) =>
        [...imagesKeys.search(), params] as const,
};

const PAGE_SIZE = 20;

/**
 * Keyword search, one page at a time.
 *
 * `useInfiniteQuery` rather than a hand-rolled accumulator: the pages are
 * keyed by the query, so a new term or a new orientation filter starts from
 * page one without a reset effect, and "load more" is a single call.
 *
 * Disabled until there is a term: an empty search is not a request the server
 * should ever have to answer.
 */
export function useImageSearch(params: { query: string; orientation?: UnsplashOrientation }) {
    return useInfiniteQuery({
        queryKey: imagesKeys.searchFor(params),
        queryFn: ({ pageParam }) =>
            imagesService.search({ ...params, page: pageParam, perPage: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.meta.hasNextPage ? allPages.length + 1 : undefined,
        enabled: params.query.trim().length > 0,
        // The upstream is metered per hour; a short window stops a user
        // flipping back and forth from spending it.
        staleTime: 60_000,
    });
}

/** The user picked a photo — the server records the download event. */
export function useSelectImage() {
    return useMutation({
        mutationFn: (photoId: string) => imagesService.select(photoId),
        onSuccess: (photo: UnsplashPhoto) => {
            toast.success(
                photo.photographerName
                    ? `Photo by ${photo.photographerName} selected`
                    : 'Photo selected'
            );
        },
        onError: () => {
            toast.error('Could not select that photo. Please try again.');
        },
    });
}

/** Records the download event on its own. */
export function useTrackImageDownload() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { photoId: string; downloadLocation?: string }) =>
            imagesService.trackDownload(input.photoId, input.downloadLocation),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: imagesKeys.all });
        },
    });
}

export { PAGE_SIZE };
