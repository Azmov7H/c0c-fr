import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import arHashtags from '../../../messages/ar/hashtags.json';
import enHashtags from '../../../messages/en/hashtags.json';
import arScripts from '../../../messages/ar/scripts.json';
import enScripts from '../../../messages/en/scripts.json';
import arTitles from '../../../messages/ar/titles.json';
import enTitles from '../../../messages/en/titles.json';
import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';

/**
 * AR-032 — script editor + scripts/titles/hashtags generation chrome.
 *
 *  1. the SURFACE .tsx files have no English UI copy left in source;
 *  2. the .ts seams carry no stray English literals;
 *  3. the English catalogs are the verbatim pre-extraction floor;
 *  4. every English key is translated, and nothing is a copy of English;
 *  5. placeholders survive, and Arabic keeps Latin digits / # inside ICU plurals.
 */
const SURFACE = [
    'src/features/scripts/components/script-editor.tsx',
    'src/features/scripts/components/script-generator.tsx',
    'src/features/titles/components/title-generator.tsx',
    'src/features/hashtags/components/hashtag-generator.tsx',
];

const TS_SEAMS = [
    'src/features/scripts/hooks/use-scripts.ts',
    'src/features/scripts/lib/script-labels.ts',
];

/** Brand/platform names are not translated; they must not trip the scanner. */
const ALLOWED = [
    'YouTube Shorts',
    'Instagram Reels',
    'YouTube Long-form',
    'YouTube',
    'TikTok',
    'Instagram',
    'Blog',
    'P06/P07',
];

const FLOOR = {
    scripts: {
        editor: {
            title: 'Script scenes (v{version})',
            summary: '{scenes} scene(s) · {words} words · {seconds}s estimated',
            refine: 'Refine with AI',
            thinking: 'AI thinking…',
            save: 'Save script',
            saving: 'Saving…',
            sceneHeading: 'Scene {number} · {label}',
            untitled: 'Untitled',
            sectionTitle: 'Section title',
            duration: 'Duration (seconds)',
            sectionText: 'Section text',
            narration: 'Narration (voiceover)',
            visualDirection: 'Visual direction',
            transition: 'Transition',
            linkedAssets: 'Linked assets',
            noLinkedAssets: 'None yet — scene links open with P06/P07.',
        },
        sceneLabels: {
            Hook: 'Hook',
            Introduction: 'Introduction',
            MainContent: 'Main Content',
            Conclusion: 'Conclusion',
            CTA: 'CTA',
            MainMessage: 'Main Message',
            SupportingInformation: 'Supporting Information',
        },
        generator: {
            pageTitle: 'Script Generator',
            pageDescription: 'AI-powered script generation with platform-specific formatting and tone control.',
            canvasTitle: 'Script Canvas',
            canvasDescription: 'Define your idea, platform, and tone',
            outputTitle: 'Generated Output',
            outputDescription: 'Your AI-crafted video script',
            ideaLabel: 'Your Idea / Brief',
            ideaPlaceholder: 'Describe your video concept, topic, or key message...',
            platform: 'Platform',
            tone: 'Tone',
            toneAria: 'Tone: {tone}',
            generating: 'Generating...',
            generate: 'Generate Script',
            generatedBadge: 'Script Generated',
            regenerate: 'Regenerate',
            copy: 'Copy',
            export: 'Export',
            emptyTitle: 'No Script Yet',
            emptyDescription: 'Enter your idea on the left and hit Generate to create an AI-powered video script.',
            tones: {
                Educational: 'Educational',
                Hype: 'Hype',
                Storytelling: 'Storytelling',
                Conversational: 'Conversational',
            },
        },
        toasts: {
            created: 'Script created successfully',
            createFailed: 'Failed to create script',
            generated: 'AI Script generated successfully! ✨',
            generateFailed: 'AI Generation failed',
            saved: 'Script saved',
            saveFailed: 'Failed to save script changes',
            deleted: 'Script deleted',
            deleteFailed: 'Failed to delete script',
        },
    },
    titles: {
        pageTitle: 'Title Generator',
        pageDescription: 'Generate high-CTR titles optimized for your platform.',
        topicSectionTitle: 'Your Topic',
        topicLabel: 'Topic / Subject',
        topicPlaceholder: 'e.g., AI video editing, content strategy, thumbnail design...',
        platform: 'Platform',
        generating: 'Generating...',
        generate: 'Generate Titles',
        outputTitle: 'Generated Titles',
        emptyTitle: 'No Titles Yet',
        emptyDescription: 'Enter your topic and generate optimized titles.',
        copied: 'Title copied to clipboard',
    },
    hashtags: {
        pageTitle: 'Hashtag Generator',
        pageDescription: 'Generate trending hashtags optimized for maximum reach.',
        configureTitle: 'Configure',
        topicLabel: 'Topic',
        topicPlaceholder: "What's your content about?",
        category: 'Category',
        generating: 'Generating...',
        generate: 'Generate Hashtags',
        outputTitle: 'Generated Hashtags',
        copyAll: 'Copy All',
        emptyTitle: 'No Hashtags Yet',
        emptyDescription: 'Enter a topic and generate trending hashtags.',
        copiedAll: 'All hashtags copied!',
        copiedOne: 'Hashtag copied!',
        copyHashtagAria: 'Copy hashtag {tag}',
        categories: {
            tech: 'tech',
            gaming: 'gaming',
            finance: 'finance',
            lifestyle: 'lifestyle',
            education: 'education',
            fitness: 'fitness',
            food: 'food',
        },
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

describe('AR-032 scripts/titles/hashtags copy', () => {
    it('the .tsx surface has no English left in the source', () => {
        for (const file of SURFACE) {
            expect(hardcodedCopy(file, { allowed: ALLOWED }), file).toEqual([]);
        }
    });

    it('the .ts seams carry no stray English literals', () => {
        // Persisted scene-label tokens are data (FR-28) — not UI chrome.
        const DATA_TOKENS = new Set([
            'Main Content',
            'Main Message',
            'Supporting Information',
        ]);
        for (const file of TS_SEAMS) {
            const prose = stringLiterals(file).filter(
                (text) => PROSE.test(text) && text !== 'use client' && !DATA_TOKENS.has(text)
            );
            expect(prose, file).toEqual([]);
        }
    });

    it('the English catalogs are verbatim the pre-extraction copy', () => {
        expect(enScripts).toEqual(FLOOR.scripts);
        expect(enTitles).toEqual(FLOOR.titles);
        expect(enHashtags).toEqual(FLOOR.hashtags);
    });

    it('every English key is translated, and nothing is a copy of English', () => {
        const pairs = [
            ['scripts', enScripts, arScripts],
            ['titles', enTitles, arTitles],
            ['hashtags', enHashtags, arHashtags],
        ] as const;
        for (const [name, en, ar] of pairs) {
            const enLeaves = leaves(en);
            const arLeaves = leaves(ar);
            expect(Object.keys(enLeaves).sort(), `${name} keys`).toEqual(Object.keys(arLeaves).sort());
            for (const [key, value] of Object.entries(enLeaves)) {
                expect(arLeaves[key]?.trim(), `${name}.${key} is empty in Arabic`).toBeTruthy();
                if (/^[A-Za-z0-9 .,:\-–—…()'"!?+#]+$/.test(value)) {
                    expect(arLeaves[key], `${name}.${key} is still English`).not.toBe(value);
                }
            }
        }
    });

    it('placeholders survive and Arabic keeps Latin digits', () => {
        const args = (message: string) =>
            [
                ...new Set(
                    [...message.matchAll(/\{([A-Za-z_][\w]*)\s*[},]/g)].map((match) => match[1])
                ),
            ].sort();
        const pairs = [
            ['scripts', enScripts, arScripts],
            ['titles', enTitles, arTitles],
            ['hashtags', enHashtags, arHashtags],
        ] as const;
        for (const [name, en, ar] of pairs) {
            const arLeaves = leaves(ar);
            for (const [key, value] of Object.entries(leaves(en))) {
                expect(args(arLeaves[key]!), `${name}.${key} placeholders`).toEqual(args(value));
                // Values should not introduce Arabic-Indic digits; keep latn.
                expect(arLeaves[key], `${name}.${key} has Arabic-Indic digits`).not.toMatch(/[٠-٩]/);
            }
        }
    });
});
