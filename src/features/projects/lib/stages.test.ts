import { describe, expect, it } from 'vitest';

import type { Project } from '@/types';
import type { Script } from '@/features/scripts/types';
import type { Thumbnail } from '@/features/thumbnails/types';
import type { AudioSuggestion } from '@/features/audio/types';
import type { MediaItem } from '@/features/media/services/media.service';
import type { ExportRecordView } from '@/features/projects/services/export.service';
import {
    currentStageId,
    deriveStages,
    stageHref,
    workflowProgress,
    type WorkflowSnapshot,
} from './stages';

const project = (overrides: Partial<Project> = {}): Project =>
    ({
        _id: 'p1',
        title: 'A project',
        idea: 'An idea',
        platform: 'youtube',
        tone: 'educational',
        status: 'draft',
        userId: 'u1',
        durationSeconds: 60,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
        ...overrides,
    }) as Project;

const script = (overrides: Partial<Script> = {}): Script =>
    ({
        id: 's1',
        projectId: 'p1',
        userId: 'u1',
        sections: [{ order: 0, label: 'Hook', content: 'Hi' }],
        wordCount: 10,
        estimatedTime: '0:10',
        readingLevel: 'B1',
        sentiment: 'Neutral',
        status: 'completed',
        version: 1,
        isDeleted: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
        ...overrides,
    }) as Script;

const thumbnail = (overrides: Partial<Thumbnail> = {}): Thumbnail =>
    ({
        id: 't1',
        projectId: 'p1',
        userId: 'u1',
        prompt: 'a prompt',
        stylePreset: 'cinematic',
        colorPalette: 'warm',
        dimensions: { width: 1280, height: 720 },
        imageUrl: 'https://res.cloudinary.com/x/thumb.png',
        status: 'completed',
        isDeleted: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
        ...overrides,
    }) as Thumbnail;

const audio = (overrides: Partial<AudioSuggestion> = {}): AudioSuggestion =>
    ({
        id: 'a1',
        projectId: 'p1',
        userId: 'u1',
        mood: 'calm',
        musicType: 'ambient',
        tracks: [],
        sfxSuggestions: [],
        timelinePlacements: [],
        analysisConfidence: 0.8,
        status: 'completed',
        fileUrl: 'https://res.cloudinary.com/x/narration.mp3',
        assetType: 'narration',
        isCurrent: true,
        isDeleted: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
        ...overrides,
    }) as AudioSuggestion;

const image = (slot: number): MediaItem =>
    ({
        _id: `m${slot}`,
        userId: 'u1',
        projectId: 'p1',
        title: `Image ${slot + 1}`,
        category: 'image',
        source: 'generated',
        mimeType: 'image/png',
        fileUrl: `https://res.cloudinary.com/x/img-${slot}.png`,
        isPublic: false,
        metadata: { slot },
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
    }) as MediaItem;

const exportRecord = (overrides: Partial<ExportRecordView> = {}): ExportRecordView =>
    ({
        id: 'e1',
        scope: 'full',
        status: 'completed',
        creditCost: 0,
        estimateBytes: 1024,
        startedAt: '2026-11-01T00:00:00.000Z',
        completedAt: '2026-11-01T00:00:01.000Z',
        reason: null,
        manifestHash: 'hash',
        ...overrides,
    }) as ExportRecordView;

const snapshot = (overrides: Partial<WorkflowSnapshot> = {}): WorkflowSnapshot => ({
    project: project(),
    scripts: [],
    thumbnails: [],
    audio: [],
    media: [],
    exports: [],
    ...overrides,
});

const stage = (stages: ReturnType<typeof deriveStages>, id: string) => {
    const found = stages.find((s) => s.id === id);
    if (!found) throw new Error(`stage ${id} missing`);
    return found;
};

describe('deriveStages (P11.1)', () => {
    it('has ten stages in the documented order', () => {
        const stages = deriveStages(snapshot());
        expect(stages.map((s) => s.id)).toEqual([
            'creation',
            'configuration',
            'script',
            'script-edit',
            'thumbnail',
            'scene-images',
            'narration',
            'sfx',
            'preview',
            'export',
        ]);
    });

    it('an empty project has only creation and configuration complete', () => {
        const stages = deriveStages(snapshot());
        expect(stage(stages, 'creation').complete).toBe(true);
        expect(stage(stages, 'configuration').complete).toBe(true);
        expect(stage(stages, 'script').complete).toBe(false);
        expect(stage(stages, 'script-edit').blockedReason).toBe('Generate the script first');
        expect(stage(stages, 'export').blockedReason).toBe('Generate a script to export');
        expect(currentStageId(stages)).toBe('script');
    });

    it('a script with sections completes the script stage but not the edit stage', () => {
        const stages = deriveStages(snapshot({ scripts: [script()] }));
        expect(stage(stages, 'script').complete).toBe(true);
        expect(stage(stages, 'script').detail).toContain('1 scene(s)');
        expect(stage(stages, 'script-edit').complete).toBe(false);
        expect(stage(stages, 'script-edit').blockedReason).toBeNull();
        expect(currentStageId(stages)).toBe('script-edit');
    });

    it('a script without sections does not complete the script stage', () => {
        const stages = deriveStages(snapshot({ scripts: [script({ sections: [] })] }));
        expect(stage(stages, 'script').complete).toBe(false);
        expect(stage(stages, 'script-edit').blockedReason).toBe('Generate the script first');
    });

    it('version > 1 means the script was edited', () => {
        const stages = deriveStages(snapshot({ scripts: [script({ version: 2 })] }));
        expect(stage(stages, 'script-edit').complete).toBe(true);
        expect(stage(stages, 'script-edit').detail).toContain('Edited');
    });

    it('a deleted script is not a script', () => {
        const stages = deriveStages(snapshot({ scripts: [script({ isDeleted: true })] }));
        expect(stage(stages, 'script').complete).toBe(false);
    });

    it('the newest script wins when several exist', () => {
        const stages = deriveStages(
            snapshot({
                scripts: [
                    script({ id: 'old', version: 1, createdAt: '2026-11-01T00:00:00.000Z' }),
                    script({
                        id: 'new',
                        version: 3,
                        sections: [
                            { order: 0, label: 'Hook', content: 'a' },
                            { order: 1, label: 'CTA', content: 'b' },
                        ],
                        createdAt: '2026-11-05T00:00:00.000Z',
                    }),
                ],
            })
        );
        expect(stage(stages, 'script').detail).toContain('2 scene(s)');
        expect(stage(stages, 'script-edit').complete).toBe(true);
    });

    it('only a completed thumbnail with an image counts', () => {
        expect(stage(deriveStages(snapshot()), 'thumbnail').complete).toBe(false);
        expect(
            stage(deriveStages(snapshot({ thumbnails: [thumbnail({ status: 'error' })] })), 'thumbnail')
                .complete
        ).toBe(false);
        expect(
            stage(
                deriveStages(snapshot({ thumbnails: [thumbnail({ imageUrl: undefined })] })),
                'thumbnail'
            ).complete
        ).toBe(false);
        expect(
            stage(deriveStages(snapshot({ thumbnails: [thumbnail()] })), 'thumbnail').complete
        ).toBe(true);
    });

    it('gallery images are counted by their slot, not by every image', () => {
        const withoutSlot = { ...image(0), metadata: undefined } as MediaItem;
        const stages = deriveStages(snapshot({ media: [withoutSlot] }));
        expect(stage(stages, 'scene-images').complete).toBe(false);
        expect(stage(stages, 'scene-images').detail).toBe('0 of 3 image slot(s) filled');

        const filled = deriveStages(snapshot({ media: [image(0), image(1)] }));
        expect(stage(filled, 'scene-images').complete).toBe(true);
        expect(stage(filled, 'scene-images').detail).toBe('2 of 3 image slot(s) filled');
    });

    it('narration and effects are per layer, and a legacy row counts as narration', () => {
        const legacy = audio({ assetType: undefined });
        const stages = deriveStages(snapshot({ audio: [legacy] }));
        expect(stage(stages, 'narration').complete).toBe(true);
        expect(stage(stages, 'sfx').complete).toBe(false);

        const withEffects = deriveStages(
            snapshot({
                audio: [
                    legacy,
                    audio({ id: 'a2', assetType: 'sfx', fileUrl: 'https://res.cloudinary.com/x/sfx.mp3' }),
                ],
            })
        );
        expect(stage(withEffects, 'sfx').complete).toBe(true);
        expect(stage(withEffects, 'sfx').detail).toContain('1 effect layer(s)');
    });

    it('an audio row without a file is not a finished layer', () => {
        const stages = deriveStages(snapshot({ audio: [audio({ fileUrl: undefined })] }));
        expect(stage(stages, 'narration').complete).toBe(false);
    });

    it('the preview completes only when every assembled asset is there', () => {
        const partial = deriveStages(snapshot({ scripts: [script()] }));
        expect(stage(partial, 'preview').complete).toBe(false);
        expect(stage(partial, 'preview').blockedReason).toContain('Finish the asset stages');

        const full = deriveStages(
            snapshot({
                scripts: [script()],
                thumbnails: [thumbnail()],
                media: [image(0)],
                audio: [audio()],
            })
        );
        expect(stage(full, 'preview').complete).toBe(true);
        expect(stage(full, 'preview').blockedReason).toBeNull();
    });

    it('only a completed export record completes the export stage', () => {
        const failed = deriveStages(snapshot({ exports: [exportRecord({ status: 'failed' })] }));
        expect(stage(failed, 'export').complete).toBe(false);

        const done = deriveStages(snapshot({ exports: [exportRecord()] }));
        expect(stage(done, 'export').complete).toBe(true);
    });

    it('reports progress and the current stage', () => {
        const stages = deriveStages(
            snapshot({ scripts: [script({ version: 2 })], thumbnails: [thumbnail()] })
        );
        expect(workflowProgress(stages)).toEqual({ done: 5, total: 10 });
        expect(currentStageId(stages)).toBe('scene-images');
    });

    it('every stage deep-links into the tab that performs it', () => {
        const stages = deriveStages(snapshot());
        expect(stageHref('p1', stage(stages, 'script'))).toBe(
            '/projects/p1?stage=script#scripts'
        );
        expect(stageHref('p1', stage(stages, 'narration'))).toBe(
            '/projects/p1?tab=media&stage=narration#narration'
        );
        expect(stageHref('p1', stage(stages, 'preview'))).toBe('/projects/p1?tab=preview&stage=preview');
        // The creation stage lives in the header — no tab, no anchor.
        expect(stageHref('p1', stage(stages, 'creation'))).toBe('/projects/p1?stage=creation');
    });

    it('a project that is not loaded yet derives no completed stage', () => {
        const stages = deriveStages(snapshot({ project: undefined }));
        expect(stage(stages, 'creation').complete).toBe(false);
        expect(stage(stages, 'configuration').complete).toBe(false);
    });
});
