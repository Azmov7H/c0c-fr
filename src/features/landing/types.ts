import type { LucideIcon } from 'lucide-react';

/**
 * The four assets are the product (T11): thumbnails, scripts, sound effects,
 * images. Everything on the landing page is organised around them — the type
 * exists so the hero, the asset cards and the how-it-works steps cannot drift
 * apart on naming.
 *
 * AR-022: the id and the ICON are code; the title and the description are
 * copy, and copy lives in the catalog (`landing.assets.items`). The type is
 * therefore split in two: the id — which the code uses to pick the icon and
 * the example — and the copy — which comes from the catalog.
 */
export type LandingAssetId = 'thumbnails' | 'scripts' | 'sound-effects' | 'images';

export interface LandingAsset {
    id: LandingAssetId;
    icon: LucideIcon;
}

/** One asset as the catalog describes it. */
export interface LandingAssetCopy {
    id: LandingAssetId;
    /** The label form the figure's aria-label uses (lowercase, no id). */
    example: string;
    title: string;
    description: string;
}
