import type { LucideIcon } from 'lucide-react';

/**
 * The four assets are the product (T11): thumbnails, scripts, sound effects,
 * images. Everything on the landing page is organised around them — the type
 * exists so the hero, the asset cards and the how-it-works steps cannot drift
 * apart on naming.
 */
export interface LandingAsset {
    id: 'thumbnails' | 'scripts' | 'sound-effects' | 'images';
    title: string;
    /** Concrete, verb-first description — no "AI-powered creative tooling". */
    description: string;
    icon: LucideIcon;
}

export interface PlanTier {
    id: 'starter' | 'pro' | 'studio';
    name: string;
    /** Who the tier is for, in one line. */
    audience: string;
    features: readonly string[];
    highlighted?: boolean;
    /** "Free forever" / "Paid plans announced at launch" — never a number. */
    priceNote: string;
}
