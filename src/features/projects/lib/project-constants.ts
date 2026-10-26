import type { ContentTone, Platform, ProjectStatus } from '@/types';

/**
 * T20: the vocabulary and labels live apart from the zod schema. Components
 * that only render a status chip or a platform name used to import them from
 * `project-schemas`, which dragged zod (~14 kB gzip) into every workspace and
 * projects-page bundle for a schema those components never call.
 *
 * Mirrors c0c-bake/src/modules/projects/projects.validation.ts exactly. The
 * limits are named once and consumed by both the schema and the character
 * counters, so a counter can never disagree with the validator that will
 * reject the submit. `project-schemas.test.ts` pins the values against the
 * backend contract — change one side and the test fails.
 */
export const PROJECT_LIMITS = {
    title: 200,
    description: 1000,
    idea: 5000,
} as const;

export const PROJECT_PLATFORMS = ['youtube', 'tiktok', 'instagram'] as const satisfies readonly Platform[];

export const PROJECT_TONES = [
    'educational',
    'dramatic',
    'viral',
    'storytelling',
    'casual',
    'professional',
] as const satisfies readonly ContentTone[];

export const PROJECT_STATUSES = [
    'draft',
    'processing',
    'completed',
    'archived',
] as const satisfies readonly ProjectStatus[];

export interface PlatformChoice {
    value: Platform;
    label: string;
    summary: string;
    affects: string;
}

export const PLATFORM_CHOICES: PlatformChoice[] = [
    {
        value: 'youtube',
        label: 'YouTube',
        summary: 'Long-form and Shorts',
        affects: '16:9 thumbnails, 8–12 minute scripts, 3–5 broad hashtags.',
    },
    {
        value: 'tiktok',
        label: 'TikTok',
        summary: 'Short, fast-paced video',
        affects: '9:16 thumbnails, 30–60 second scripts, trending sound-led hooks.',
    },
    {
        value: 'instagram',
        label: 'Instagram',
        summary: 'Reels and carousels',
        affects: '4:5 / 9:16 visuals, 30–90 second scripts, up to 30 niche hashtags.',
    },
];

export interface ToneChoice {
    value: ContentTone;
    label: string;
    description: string;
}

export const TONE_CHOICES: ToneChoice[] = [
    { value: 'educational', label: 'Educational', description: 'Teach one clear idea with a takeaway.' },
    { value: 'dramatic', label: 'Dramatic', description: 'Build tension and reveal a payoff.' },
    { value: 'viral', label: 'Viral', description: 'Short, punchy and built around a hook.' },
    { value: 'storytelling', label: 'Storytelling', description: 'Narrative arc with a character and stakes.' },
    { value: 'casual', label: 'Casual', description: 'Conversational, like explaining to a friend.' },
    { value: 'professional', label: 'Professional', description: 'Polished, credible and precise.' },
];

export const TONE_LABEL: Record<ContentTone, string> = Object.fromEntries(
    TONE_CHOICES.map((choice) => [choice.value, choice.label])
) as Record<ContentTone, string>;

export const PLATFORM_LABEL: Record<Platform, string> = Object.fromEntries(
    PLATFORM_CHOICES.map((choice) => [choice.value, choice.label])
) as Record<Platform, string>;

export const STATUS_LABEL: Record<ProjectStatus, string> = {
    draft: 'Draft',
    processing: 'In progress',
    completed: 'Completed',
    archived: 'Archived',
};
