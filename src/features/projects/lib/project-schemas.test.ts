import { describe, expect, it } from 'vitest';

import {
    PROJECT_LIMITS,
    PROJECT_PLATFORMS,
    PROJECT_STATUSES,
    PROJECT_TONES,
    projectFormSchema,
} from './project-schemas';

const valid = {
    title: 'A title',
    description: 'A description',
    idea: 'An idea',
    platform: 'youtube' as const,
    tone: 'educational' as const,
};

describe('project schema mirrors the backend contract', () => {
    it('pins the limits used by the counters and the backend validator', () => {
        expect(PROJECT_LIMITS).toEqual({ title: 200, description: 1000, idea: 5000 });
    });

    it('pins the enum vocabularies', () => {
        expect(PROJECT_PLATFORMS).toEqual(['youtube', 'tiktok', 'instagram']);
        expect(PROJECT_TONES).toEqual([
            'educational',
            'dramatic',
            'viral',
            'storytelling',
            'casual',
            'professional',
        ]);
        expect(PROJECT_STATUSES).toEqual(['draft', 'processing', 'completed', 'archived']);
    });

    it.each([
        ['title', PROJECT_LIMITS.title],
        ['description', PROJECT_LIMITS.description],
        ['idea', PROJECT_LIMITS.idea],
    ] as const)('accepts exactly %s=%i and rejects one more', (field, limit) => {
        expect(projectFormSchema.safeParse({ ...valid, [field]: 'a'.repeat(limit) }).success).toBe(true);
        expect(projectFormSchema.safeParse({ ...valid, [field]: 'a'.repeat(limit + 1) }).success).toBe(
            false
        );
    });

    it('requires a non-empty title and idea after trimming', () => {
        expect(projectFormSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
        expect(projectFormSchema.safeParse({ ...valid, idea: '   ' }).success).toBe(false);
    });

    it('rejects platforms and tones the backend would reject', () => {
        expect(projectFormSchema.safeParse({ ...valid, platform: 'shorts' }).success).toBe(false);
        expect(projectFormSchema.safeParse({ ...valid, tone: 'funny' }).success).toBe(false);
    });
});
