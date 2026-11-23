'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription } from '@/components/ui/alert';

import type { VideoPreview } from '../types';

/** The engine's fixed 16:9 canvas. The wrapper scales it to the viewport. */
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

/**
 * Renders the exact HTML document the render worker seeks through. `srcDoc`
 * keeps it in-memory (no blob URL, no re-hosting), and `allow-scripts` without
 * `allow-same-origin` is the XSS boundary: the player can animate, but cannot
 * reach the parent document, cookies or storage.
 */
export function PreviewPlayer({ preview }: { preview?: VideoPreview }) {
    const t = useTranslations('advertisements');
    const frameRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return;

        const update = () => setScale(frame.clientWidth / STAGE_WIDTH);
        update();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', update);
            return () => window.removeEventListener('resize', update);
        }
        const observer = new ResizeObserver(update);
        observer.observe(frame);
        return () => observer.disconnect();
    }, [preview?.html]);

    if (!preview?.html) {
        return (
            <Alert>
                <AlertDescription>{t('composition.previewUnavailable')}</AlertDescription>
            </Alert>
        );
    }

    // The server owns this value; accept only the documented sandbox token.
    const sandbox = preview.sandbox === 'allow-scripts' ? 'allow-scripts' : '';

    return (
        <div
            ref={frameRef}
            className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black"
            data-testid="advertisement-preview"
        >
            <iframe
                title={t('composition.previewTitle')}
                aria-label={t('composition.previewTitle')}
                srcDoc={preview.html}
                sandbox={sandbox}
                referrerPolicy="no-referrer"
                className="absolute size-auto border-0"
                style={{
                    width: STAGE_WIDTH,
                    height: STAGE_HEIGHT,
                    insetInlineStart: 0,
                    top: 0,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                }}
            />
        </div>
    );
}
