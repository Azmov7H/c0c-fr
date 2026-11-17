/**
 * The stock-photo (Unsplash) contract, mirrored from the backend.
 *
 * `UnsplashPhoto` is what the server normalises out of the API's response;
 * `UnsplashAssetMetadata` is what travels with the asset once it is stored,
 * so every surface that shows the photo can credit the photographer.
 */

/** A photo as the API returned it, normalised by the server. */
export interface UnsplashPhoto {
    /** Unsplash's own photo id — the stable handle for attribution. */
    photoId: string;
    /** The hotlinked image, exactly as the API returned it (ixid included). */
    imageUrl: string;
    /** The hotlinked thumbnail, exactly as the API returned it. */
    thumbnailUrl: string;
    /** The unsized base URL. */
    rawUrl: string;
    photographerName: string;
    photographerUsername: string;
    /** The photographer's Unsplash profile, with the referral parameters. */
    photographerProfileUrl: string;
    /** The photo's page on Unsplash, with the referral parameters. */
    photoPageUrl: string;
    /** The endpoint that records the download event. */
    downloadLocation: string;
    altDescription: string;
    description: string;
    width: number;
    height: number;
    /** Unsplash's dominant colour — the placeholder while the photo loads. */
    color: string;
    /** The API's blur hash, when it sent one. */
    blurHash: string | null;
    source: 'unsplash';
}

/**
 * The provenance stored with the asset.
 *
 * The Unsplash guidelines require the photographer and the platform to be
 * credited wherever a photo is displayed, and both links have to carry the
 * referral parameters — so they are stored WITH the asset, not rebuilt from
 * the photo id later.
 */
export interface UnsplashAssetMetadata {
    source: 'unsplash';
    photoId: string;
    imageUrl: string;
    thumbnailUrl?: string;
    photographerName?: string;
    photographerUsername?: string;
    photographerProfileUrl?: string;
    photoPageUrl?: string;
    downloadLocation?: string;
    altDescription?: string;
    width?: number;
    height?: number;
}

export type UnsplashOrientation = 'landscape' | 'portrait' | 'squarish';
export type UnsplashOrderBy = 'relevant' | 'latest';

export interface ImageSearchParams {
    query: string;
    page?: number;
    perPage?: number;
    orientation?: UnsplashOrientation;
    orderBy?: UnsplashOrderBy;
}

/**
 * Builds the provenance record for a photo the user just picked.
 *
 * This is what travels with the asset, so the attribution is always
 * available — including its referral parameters.
 */
export const unsplashMetadataFromPhoto = (photo: UnsplashPhoto): UnsplashAssetMetadata => ({
    source: 'unsplash',
    photoId: photo.photoId,
    imageUrl: photo.imageUrl,
    thumbnailUrl: photo.thumbnailUrl,
    photographerName: photo.photographerName || undefined,
    photographerUsername: photo.photographerUsername || undefined,
    photographerProfileUrl: photo.photographerProfileUrl || undefined,
    photoPageUrl: photo.photoPageUrl || undefined,
    downloadLocation: photo.downloadLocation || undefined,
    altDescription: photo.altDescription || undefined,
    width: photo.width,
    height: photo.height,
});

/**
 * Reads the Unsplash provenance out of a media row's metadata.
 *
 * Returns null for anything that is not an Unsplash asset, so a caller can
 * simply ask "is this one of ours?" instead of inspecting the shape.
 */
export const unsplashMetadataOf = (
    metadata: Record<string, unknown> | undefined
): UnsplashAssetMetadata | null => {
    if (!metadata || metadata.source !== 'unsplash') return null;
    const photoId = metadata.photoId;
    if (typeof photoId !== 'string' || photoId === '') return null;

    const str = (value: unknown): string | undefined =>
        typeof value === 'string' && value !== '' ? value : undefined;
    const num = (value: unknown): number | undefined =>
        typeof value === 'number' && Number.isFinite(value) ? value : undefined;

    return {
        source: 'unsplash',
        photoId,
        imageUrl: str(metadata.imageUrl) ?? '',
        thumbnailUrl: str(metadata.thumbnailUrl),
        photographerName: str(metadata.photographerName),
        photographerUsername: str(metadata.photographerUsername),
        photographerProfileUrl: str(metadata.photographerProfileUrl),
        photoPageUrl: str(metadata.photoPageUrl),
        downloadLocation: str(metadata.downloadLocation),
        altDescription: str(metadata.altDescription),
        width: num(metadata.width),
        height: num(metadata.height),
    };
};
