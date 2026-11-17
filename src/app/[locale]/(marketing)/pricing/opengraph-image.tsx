import {
    OG_CARD_ALT,
    OG_CARD_CONTENT_TYPE,
    OG_CARD_SIZE,
    ogCardImage,
} from '@/features/seo/og-card';

/**
 * AR-025 — the social card of this segment.
 *
 * The page declares its own `openGraph` (the title, the description and the
 * locale are per locale), and a page's `openGraph` replaces the segment's —
 * with it the segment's card image. The card therefore lives in the segment
 * that owns the page, and the renderer is shared
 * (`features/seo/og-card.tsx`).
 */
export const alt = OG_CARD_ALT;
export const size = OG_CARD_SIZE;
export const contentType = OG_CARD_CONTENT_TYPE;

export default function OpengraphImage() {
    return ogCardImage();
}
