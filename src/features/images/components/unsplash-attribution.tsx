'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { UnsplashAssetMetadata } from '../types';

interface UnsplashAttributionProps {
    /** The stored provenance of the photo. */
    photo: UnsplashAssetMetadata;
    className?: string;
}

/**
 * The attribution the Unsplash guidelines require.
 *
 * "Photo by <photographer> on Unsplash", with the photographer's name linking
 * to their Unsplash profile and "Unsplash" linking to the photo's page. Both
 * links already carry the referral parameters — the server adds them when it
 * normalises the photo, so they cannot be forgotten here.
 */
export function UnsplashAttribution({ photo, className }: UnsplashAttributionProps) {
    const t = useTranslations('media');
    const name = photo.photographerName || photo.photographerUsername;
    if (!name) return null;

    const linkClass = 'underline underline-offset-2 hover:text-foreground';

    return (
        <p className={cn('text-xs text-muted-foreground', className)}>
            {t('attribution.photoBy')}{' '}
            {photo.photographerProfileUrl ? (
                <a
                    href={photo.photographerProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                >
                    {name}
                </a>
            ) : (
                <span>{name}</span>
            )}{' '}
            {t('attribution.on')}{' '}
            {photo.photoPageUrl ? (
                <a
                    href={photo.photoPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                >
                    Unsplash
                </a>
            ) : (
                <span>Unsplash</span>
            )}
        </p>
    );
}
