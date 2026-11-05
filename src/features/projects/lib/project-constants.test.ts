import { describe, it, expect } from 'vitest';
import {
    PROJECT_LIMITS,
    PROJECT_PLATFORMS,
    PROJECT_TONES,
    PROJECT_STATUSES,
    PLATFORM_CHOICES,
    TONE_CHOICES,
    TONE_LABEL,
    PLATFORM_LABEL,
    STATUS_LABEL,
} from './project-constants';
import type { ContentTone, Platform, ProjectStatus } from '@/types';

/**
 * T21: project-constants is the single vocabulary source that both the
 * character counters and the project schema read. These tests pin the
 * contract mirrors c0c-bake's projects.validation: changing a limit without
 * changing the backend (or the multiplier tests below) fails here first.
 */
describe('project-constants', () => {
    it('length limits match the backend validator', () => {
        expect(PROJECT_LIMITS).toEqual({ title: 200, description: 1000, idea: 5000 });
    });

    it('every vocabulary array is non-empty and lives inside the type union', () => {
        const knownPlatforms: Platform[] = ['youtube', 'tiktok', 'instagram'];
        const knownTones: ContentTone[] = [
            'educational',
            'dramatic',
            'viral',
            'storytelling',
            'casual',
            'professional',
        ];
        const knownStatuses: ProjectStatus[] = ['draft', 'processing', 'completed', 'archived'];

        expect([...PROJECT_PLATFORMS].sort()).toEqual([...knownPlatforms].sort());
        expect([...PROJECT_TONES].sort()).toEqual([...knownTones].sort());
        expect([...PROJECT_STATUSES].sort()).toEqual([...knownStatuses].sort());
    });

    it('PLATFORM_CHOICES cover each platform once with copy attached', () => {
        const values = PLATFORM_CHOICES.map((choice) => choice.value);
        expect([...values].sort()).toEqual([...PROJECT_PLATFORMS].sort());
        for (const choice of PLATFORM_CHOICES) {
            expect(choice.summary.length).toBeGreaterThan(6);
            expect(typeof choice.label).toBe('string');
        }
    });

    it('TONE_LABEL covers every tone and no other keys', () => {
        expect(Object.keys(TONE_LABEL).sort()).toEqual([...PROJECT_TONES].sort());
        for (const choice of TONE_CHOICES) {
            expect(TONE_LABEL[choice.value]).toBe(choice.label);
            expect(choice.label.length).toBeGreaterThan(0);
            expect(choice.description.length).toBeGreaterThan(0);
        }
    });

    it('PLATFORM_LABEL covers every platform with human labels', () => {
        expect(Object.keys(PLATFORM_LABEL).sort()).toEqual([...PROJECT_PLATFORMS].sort());
        for (const choice of PLATFORM_CHOICES) {
            expect(PLATFORM_LABEL[choice.value]).toBe(choice.label);
            expect(choice.affects.length).toBeGreaterThan(8);
        }
    });

    it('STATUS_LABEL covers every status (exactly, no extras)', () => {
        expect(Object.keys(STATUS_LABEL).sort()).toEqual([...PROJECT_STATUSES].sort());
    });
});
