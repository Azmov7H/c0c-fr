'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

interface UnsplashImageProps {
    /** The hotlinked image URL, exactly as the Unsplash API returned it. */
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    sizes?: string;
}

/**
 * A hotlinked Unsplash photo.
 *
 * `unoptimized` is the point, not an oversight: the guidelines require the
 * image URLs the API returned to be used directly — with the `ixid` intact,
 * so Unsplash can attribute the view to the photographer. The Next.js
 * optimiser would fetch and re-encode the photo, which is both a needless
 * transformation and a copy of someone else's work.
 *
 * `width`/`height` are still passed, so the browser reserves the box before
 * the photo arrives: no layout shift.
 */
export function UnsplashImage({ src, alt, width, height, className, sizes }: UnsplashImageProps) {
    return (
        <Image
            src={src}
            alt={alt}
            width={width > 0 ? width : 400}
            height={height > 0 ? height : 400}
            sizes={sizes}
            unoptimized
            className={cn('object-cover', className)}
        />
    );
}
