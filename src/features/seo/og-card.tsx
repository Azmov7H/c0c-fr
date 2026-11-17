import { readFileSync } from 'node:fs';
import path from 'node:path';

import { ImageResponse } from 'next/og';

/**
 * AR-025 — the social card.
 *
 * The card is ONE image (the brand, the tagline and the four assets) that
 * every public page points at. It is rendered with next/og at build time, so
 * it costs no runtime and no client bytes.
 *
 * WHY THE RENDERER LIVES HERE: a page that declares its own `openGraph`
 * replaces the segment's — and with it the segment's card image. The
 * landing page was the only public page that kept its card, because it is
 * the page of the segment that owns `opengraph-image.tsx`. The pricing and
 * legal pages need their own segment card, so the renderer is a module and
 * each segment's `opengraph-image.tsx` is a three-line wrapper around it.
 *
 * THE FONTS ARE VENDORED (assets/fonts — Inter, SIL OFL 1.1, license next
 * to them). Without local fonts, ImageResponse fetches its default face from
 * Google's CDN while prerendering, which made builds fail outright whenever
 * that request timed out (observed: ETIMEDOUT, whole build exited 1). Build
 * determinism is worth the committed woff.
 *
 * WHAT IS NOT HERE YET: an ARABIC card. Satori — the renderer inside
 * next/og — does not shape Arabic: the letters come out disconnected and
 * reversed (verified by rendering the card, not by reading the docs). The
 * card's own text therefore stays English for now, and the metadata around
 * it (the title, the description, the locale, the URL) is per locale.
 */
export const OG_CARD_ALT = 'AI Content Engine — everything a video needs, in one place';

export const OG_CARD_SIZE = { width: 1200, height: 630 };

export const OG_CARD_CONTENT_TYPE = 'image/png';

const fontDir = path.join(process.cwd(), 'assets', 'fonts');
const interRegular = readFileSync(path.join(fontDir, 'inter-latin-400-normal.woff'));
const interBold = readFileSync(path.join(fontDir, 'inter-latin-700-normal.woff'));

/**
 * The four assets the card names.
 *
 * The card's own text is still English for both locales — see the note
 * above about the renderer. It is a follow-up to read these from the
 * catalog (`landing.assets.items[].title`) together with an Arabic card.
 */
const ASSETS = ['Thumbnails', 'Scripts', 'Sound effects', 'Images'] as const;

/** The card itself. */
export function ogCardImage(): ImageResponse {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '72px',
                    backgroundColor: '#0b0b0f',
                    color: '#fafafa',
                    fontFamily: 'Inter',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            backgroundColor: '#2b6cee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            fontWeight: 700,
                        }}
                    >
                        AI
                    </div>
                    <span style={{ fontSize: 30, fontWeight: 600 }}>
                        AI Content Engine
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 28,
                    }}
                >
                    <span style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
                        Everything a video needs, in one place.
                    </span>
                    <span style={{ fontSize: 32, color: '#a1a1aa' }}>
                        {ASSETS.join(' · ')}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                    {ASSETS.map((asset) => (
                        <span
                            key={asset}
                            style={{
                                fontSize: 26,
                                padding: '10px 22px',
                                borderRadius: 999,
                                border: '1px solid #2b6cee',
                                color: '#93b4f5',
                            }}
                        >
                            {asset}
                        </span>
                    ))}
                </div>
            </div>
        ),
        {
            ...OG_CARD_SIZE,
            fonts: [
                { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
                { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
            ],
        }
    );
}
