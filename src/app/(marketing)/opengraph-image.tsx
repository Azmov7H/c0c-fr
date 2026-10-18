import { readFileSync } from 'node:fs';
import path from 'node:path';

import { ImageResponse } from 'next/og';

/**
 * OG/Twitter card, 1200×630, generated with next/og at build time (the
 * marketing route is static, so this is prerendered too — no runtime cost).
 *
 * The fonts are vendored in assets/fonts (Inter, SIL OFL 1.1 — license next
 * to them). Without local fonts, ImageResponse fetches its default face from
 * Google's CDN while prerendering, which made builds fail outright whenever
 * that request timed out (observed: ETIMEDOUT, whole build exited 1). Build
 * determinism is worth 63 kB of committed woff.
 */
export const alt = 'AI Content Engine — everything a video needs, in one place';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontDir = path.join(process.cwd(), 'assets', 'fonts');
const interRegular = readFileSync(path.join(fontDir, 'inter-latin-400-normal.woff'));
const interBold = readFileSync(path.join(fontDir, 'inter-latin-700-normal.woff'));

const ASSETS = ['Thumbnails', 'Scripts', 'Sound effects', 'Images'] as const;

export default function OpengraphImage() {
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
                            fontSize: 34,
                            fontWeight: 700,
                        }}
                    >
                        ⚡
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
            ...size,
            fonts: [
                { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
                { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
            ],
        }
    );
}
