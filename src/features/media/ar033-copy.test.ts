import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import arAudio from '../../../messages/ar/audio.json';
import enAudio from '../../../messages/en/audio.json';
import arThumbnails from '../../../messages/ar/thumbnails.json';
import enThumbnails from '../../../messages/en/thumbnails.json';
import arMedia from '../../../messages/ar/media.json';
import enMedia from '../../../messages/en/media.json';
import arBilling from '../../../messages/ar/billing.json';
import enBilling from '../../../messages/en/billing.json';
import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';

/**
 * AR-033 — audio studio + thumbnails + media library extraction.
 *
 *  1. the SURFACE .tsx files have no English UI copy left in source;
 *  2. the .ts seams carry no stray English literals;
 *  3. the English catalogs are the verbatim pre-extraction floor;
 *  4. every English key is translated, and nothing is a copy of English;
 *  5. placeholders survive, and Arabic keeps Latin digits inside ICU plurals.
 */
const SURFACE = [
    'src/features/audio/components/audio-studio.tsx',
    'src/features/thumbnails/components/thumbnail-generator.tsx',
    'src/features/thumbnails/components/thumbnail-studio.tsx',
    'src/features/media/components/media-library.tsx',
    'src/features/images/components/unsplash-attribution.tsx',
    'src/app/[locale]/(dashboard)/thumbnails/page.tsx',
];

const TS_SEAMS = [
    'src/features/audio/hooks/use-audio.ts',
    'src/features/thumbnails/hooks/use-thumbnails.ts',
    'src/features/billing/lib/generation-error.ts',
];

const ALLOWED = [
    'Unsplash',
    'AI Powered',
    'MP3',
    'WAV',
    'OGG',
    'M4A',
    'https',
    'API',
    'BPM',
    '3840 x 2160 (Lossless)',
];

const FLOOR = {
    audio: {
        page: {
            title: 'Audio Effects',
            description: 'Generate AI-powered music and sound suggestions for your projects.',
            aiPowered: 'AI Powered',
        },
        studio: {
            projectAria: 'Project',
            projectPlaceholder: 'Choose a project',
            sonicTitle: 'Sonic architecture',
            sonicDescription: 'Pick a project, mood and generate',
            profilesTitle: 'Audio profiles',
            profilesDescription: 'Live suggestions from the API',
            generating: 'Generating…',
            generate: 'Generate audio profile',
            loading: 'Loading audio…',
            quotaTitle: 'Generation quota reached',
            quotaCta: 'Upgrade for more generations',
            currentAudio: 'Current audio',
            currentAudioAria: 'Current audio',
            generatedFallback: 'generated',
            expired: 'This audio link expired — regenerate or re-upload.',
            legacySuggestion: 'Legacy suggestion (no file). Generate or upload to get a playable asset.',
            replaceAria: 'Replace current audio',
            replacing: 'Replacing…',
            replace: 'Replace',
            downloadAria: 'Download current audio',
            download: 'Download',
            externalUrlLabel: 'External audio URL',
            externalUrlPlaceholder: 'https://…/audio.mp3',
            upload: 'Upload',
            historyVersions: '{count, plural, one {# previous version kept as history.} other {# previous versions kept as history.}}',
            createProjectFirst: 'Create a project first to generate audio.',
            emptyTitle: 'No audio profiles yet',
            emptyDescription: 'Choose a mood and generate suggestions for your selected project.',
            playTrack: 'Play {title}',
        },
        moods: {
            energeticFast: {
                label: 'Energetic & Fast',
                description: 'High tempo, impactful beats',
            },
            suspensefulEpic: {
                label: 'Suspenseful Epic',
                description: 'Deep bass, cinematic tension',
            },
            lofiChill: {
                label: 'Lo-fi & Chill',
                description: 'Relaxed vibes, atmospheric',
            },
            educational: {
                label: 'Educational',
                description: 'Clear, unobtrusive ambient',
            },
        },
        validation: {
            noFile: 'No file selected.',
            unsupportedType: 'Unsupported audio type ({type}). Use MP3, WAV, OGG or M4A.',
            tooLarge: 'Audio file exceeds 25 MB.',
            invalidUrl: 'Enter a valid https audio URL.',
            urlMustBeHttps: 'Audio URL must be https.',
        },
        toasts: {
            analysisStarted: 'Audio analysis started',
            analysisFailed: 'Failed to start audio analysis',
            generated: 'AI Audio profile generated! 🎵',
            generateFailed: 'AI Audio generation failed',
            updated: 'Audio profile updated',
            updateFailed: 'Failed to update audio profile',
            uploaded: 'Audio uploaded',
            uploadFailed: 'Failed to upload audio',
            replaced: 'Audio replaced',
            replaceFailed: 'Replacement failed — previous audio kept',
            deleted: 'Audio profile deleted',
            deleteFailed: 'Failed to delete audio profile',
        },
    },
    thumbnails: {
        page: {
            title: 'Thumbnail Studio',
            description: 'Create eye-catching thumbnails with AI-powered generation.',
            aiPowered: 'AI Powered',
        },
        generator: {
            visualCore: 'Visual Core',
            visualCoreDescription: 'Direct the AI vision for your masterpiece',
            directive: 'The Directive',
            directivePlaceholder: 'A cybernetic detective in a neon-lit alleyway, hyper-detailed, synthwave color palette...',
            chars: '{count} chars',
            visualFrequency: 'Visual Frequency',
            thePhotograph: 'The Photograph',
            changePhoto: 'Change photo',
            choosePhoto: 'Choose a photo',
            rendering: 'Rendering...',
            breatheLife: 'Breathe Life',
            theRender: 'The Render',
            renderDescription: 'Stock photograph · Unsplash',
            fetchArtifact: 'Fetch Artifact',
            neuralAssembly: 'Neural Assembly',
            neuralAssemblyDescription: 'Our visual processing units are weaving your directive into reality. Perfection takes a moment.',
            voidTitle: 'The Void Awaits',
            voidDescription: "Inject a visual directive in the architect panel to materialize your project's identity.",
        },
        studio: {
            visualCore: 'Visual Core',
            visualCoreDescription: 'Define your thumbnail directive.',
            prompt: 'Prompt',
            promptPlaceholder: 'A cybernetic detective in a neon-lit alleyway...',
            chars: '{count} chars',
            stylePreset: 'Style Preset',
            rendering: 'Rendering...',
            generate: 'Generate Thumbnail',
            download: 'Download',
            theRender: 'The Render',
            renderMeta: '3840 x 2160 (Lossless)',
            resultAlt: 'Generated thumbnail',
            emptyTitle: 'No Thumbnail Yet',
            emptyDescription: 'Describe your thumbnail vision and let AI bring it to life.',
        },
        styles: {
            '3d-render': {
                label: '3D Render',
                description: 'Soft shadows, clay-like depth',
            },
            cinematic: {
                label: 'Cinematic',
                description: 'High contrast, dramatic lighting',
            },
            minimalist: {
                label: 'Minimalist',
                description: 'Flat vector, clean lines',
            },
        },
        toasts: {
            submitted: 'Thumbnail prompt submitted',
            submitFailed: 'Failed to submit thumbnail prompt',
            updated: 'Thumbnail updated',
            updateFailed: 'Failed to update thumbnail',
            regenerated: 'Thumbnail regenerated',
            regenerateFailed: 'Failed to regenerate thumbnail',
            deleted: 'Thumbnail deleted',
            deleteFailed: 'Failed to delete thumbnail',
        },
    },
} as const;

const MEDIA_ADDITIONS = {
    attribution: {
        photoBy: 'Photo by',
        on: 'on',
    },
    library: {
        title: 'Media library',
        description: 'Every generated or attached asset for the selected project.',
        uploadDisabledTitle: 'Uploads need a storage provider, which is not configured yet.',
        upload: 'Upload',
        projectAria: 'Project',
        projectPlaceholder: 'Choose a project',
        uploadsDisabled: 'Uploads are disabled until a storage provider is connected.',
        searchPlaceholder: 'Search assets...',
        tabs: {
            all: 'All',
            images: 'Images',
            videos: 'Videos',
            audio: 'Audio',
            documents: 'Documents',
        },
        loading: 'Loading media',
        emptyFoundTitle: 'No assets found',
        emptyFoundDescription: 'Try adjusting your search or filters.',
        emptyTitle: 'No media yet',
        emptyDescription: 'Generated media from your projects will appear here.',
    },
} as const;

function leaves(value: unknown, prefix = ''): Record<string, string> {
    if (typeof value === 'string') return { [prefix]: value };
    if (!value || typeof value !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const next = prefix ? `${prefix}.${key}` : key;
        Object.assign(out, leaves(child, next));
    }
    return out;
}

const PROSE = /[A-Za-z]{3,}(?:[ ][A-Za-z]{3,})+/;

function stringLiterals(file: string): string[] {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .split('\n')
        .filter((line) => !/^\s*import\b/.test(line))
        .join('\n');
    return [...source.matchAll(/(['"`])([^'"`\n]{6,})\1/g)].map((match) => match[2]);
}

describe('AR-033 audio/thumbnails/media copy', () => {
    it('the .tsx surface has no English left in the source', () => {
        for (const file of SURFACE) {
            expect(hardcodedCopy(file, { allowed: ALLOWED }), file).toEqual([]);
        }
    });

    it('the .ts seams carry no stray English literals', () => {
        const ALLOWED_LITERALS = new Set([
            'Top up or upgrade in Billing to continue.',
            'Upgrade for more generations.',
        ]);
        for (const file of TS_SEAMS) {
            const prose = stringLiterals(file).filter(
                (text) =>
                    PROSE.test(text) &&
                    text !== 'use client' &&
                    !ALLOWED_LITERALS.has(text)
            );
            expect(prose, file).toEqual([]);
        }
    });

    it('the English catalogs are verbatim the pre-extraction copy', () => {
        expect(enAudio).toEqual(FLOOR.audio);
        expect(enThumbnails).toEqual(FLOOR.thumbnails);
        expect(enMedia.attribution).toEqual(MEDIA_ADDITIONS.attribution);
        expect(enMedia.library).toEqual(MEDIA_ADDITIONS.library);
        expect(enBilling.generation).toEqual({
            creditSuffix: 'Top up or upgrade in Billing to continue.',
            quotaSuffix: 'Upgrade for more generations.',
        });
    });

    it('every English key is translated, and nothing is a copy of English', () => {
        const pairs = [
            ['audio', enAudio, arAudio],
            ['thumbnails', enThumbnails, arThumbnails],
        ] as const;
        for (const [name, en, ar] of pairs) {
            const enLeaves = leaves(en);
            const arLeaves = leaves(ar);
            expect(Object.keys(enLeaves).sort(), `${name} keys`).toEqual(
                Object.keys(arLeaves).sort()
            );
            for (const [key, value] of Object.entries(enLeaves)) {
                expect(arLeaves[key]?.trim(), `${name}.${key} is empty in Arabic`).toBeTruthy();
                const sameAllowed = /^https?:\/\//.test(value);
                if (!sameAllowed && /^[A-Za-z0-9 .,:\-–—…()'"!?+#/]+$/.test(value)) {
                    expect(arLeaves[key], `${name}.${key} is still English`).not.toBe(value);
                }
            }
        }

        // Media additions (AR-033 only; rest of media was AR-031)
        for (const section of ['attribution', 'library'] as const) {
            const enLeaves = leaves((enMedia as Record<string, unknown>)[section]);
            const arLeaves = leaves((arMedia as Record<string, unknown>)[section]);
            expect(Object.keys(enLeaves).sort(), `media.${section} keys`).toEqual(
                Object.keys(arLeaves).sort()
            );
            for (const [key, value] of Object.entries(enLeaves)) {
                expect(arLeaves[key]?.trim(), `media.${section}.${key} empty`).toBeTruthy();
                if (/^[A-Za-z0-9 .,:\-–—…()'"!?+#/]+$/.test(value)) {
                    expect(arLeaves[key], `media.${section}.${key} still English`).not.toBe(value);
                }
            }
        }

        expect(arBilling.generation.creditSuffix).toBeTruthy();
        expect(arBilling.generation.quotaSuffix).toBeTruthy();
        expect(arBilling.generation.creditSuffix).not.toBe(enBilling.generation.creditSuffix);
        expect(arBilling.generation.quotaSuffix).not.toBe(enBilling.generation.quotaSuffix);
    });

    it('placeholders survive and Arabic keeps Latin digits in ICU plurals', () => {
        const check = (en: unknown, ar: unknown, name: string) => {
            const enLeaves = leaves(en);
            const arLeaves = leaves(ar);
            for (const [key, value] of Object.entries(enLeaves)) {
                const arValue = arLeaves[key] ?? '';
                const simplePh = (value.match(/\{[a-zA-Z][a-zA-Z0-9]*\}/g) ?? []).sort();
                const arSimplePh = (arValue.match(/\{[a-zA-Z][a-zA-Z0-9]*\}/g) ?? []).sort();
                expect(arSimplePh, `${name}.${key} placeholders`).toEqual(simplePh);
                if (value.includes('plural,')) {
                    expect(arValue, `${name}.${key} plural`).toContain('plural,');
                    expect(arValue, `${name}.${key} #`).toContain('#');
                }
            }
        };
        check(enAudio, arAudio, 'audio');
        check(enThumbnails, arThumbnails, 'thumbnails');
        check((enMedia as Record<string, unknown>).library, (arMedia as Record<string, unknown>).library, 'media.library');

        expect(arAudio.studio.historyVersions).toContain('#');
    });
});
