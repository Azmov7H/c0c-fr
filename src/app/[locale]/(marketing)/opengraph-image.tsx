import {
    OG_CARD_ALT,
    OG_CARD_CONTENT_TYPE,
    OG_CARD_SIZE,
    ogCardImage,
} from '@/features/seo/og-card';

/**
 * AR-025 — the social card of the marketing segment (the landing page).
 *
 * The card is rendered by the shared renderer (`features/seo/og-card.tsx`);
 * this file is the file-convention wrapper that gives the segment its image
 * URL. The pricing and legal segments have their own wrappers — a page that
 * declares its own `openGraph` replaces the segment's, and with it the
 * segment's card image.
 */
export const alt = OG_CARD_ALT;
export const size = OG_CARD_SIZE;
export const contentType = OG_CARD_CONTENT_TYPE;

export default function OpengraphImage() {
    return ogCardImage();
}
