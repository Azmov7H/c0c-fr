// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as axe from 'axe-core';

import type { StageState } from '../../lib/stages';
import { WorkflowStepper } from './workflow-stepper';
import { PreviewPanel } from './preview-panel';

const mocks = vi.hoisted(() => ({
    stages: [] as StageState[],
    project: { data: { _id: 'p1', title: 'A project' }, isLoading: false },
    scripts: { data: [] as unknown[], isLoading: false },
    thumbnails: { data: [] as unknown[], isLoading: false },
    media: { data: { data: [] as unknown[] }, isLoading: false },
    audio: { data: [] as unknown[], isLoading: false },
}));

vi.mock('../../hooks/use-workflow-stages', () => ({
    useWorkflowStages: () => ({
        stages: mocks.stages,
        currentStageId: 'script',
        isLoading: false,
    }),
}));
vi.mock('../../hooks/use-projects', () => ({ useProject: () => mocks.project }));
vi.mock('@/features/scripts/hooks/use-scripts', () => ({
    useProjectScripts: () => mocks.scripts,
}));
vi.mock('@/features/thumbnails/hooks/use-thumbnails', () => ({
    useProjectThumbnails: () => mocks.thumbnails,
}));
vi.mock('@/features/media/hooks/use-media', () => ({ useProjectMedia: () => mocks.media }));
vi.mock('@/features/audio/hooks/use-audio', () => ({ useProjectAudio: () => mocks.audio }));

const stage = (overrides: Partial<StageState>): StageState => ({
    id: 'script',
    label: 'Script',
    tab: 'assets',
    ready: true,
    complete: false,
    blockedReason: null,
    detail: 'No script yet',
    ...overrides,
});

/**
 * P11.7 — the axe gate covers the stepper and every stage panel.
 *
 * `color-contrast` is excluded for the same reason the shared gate excludes
 * it: jsdom has no layout engine, so axe cannot compute rendered contrast
 * (contrast is verified by the token check in docs/a11y-audit.md).
 */
describe('axe gate (P11.7)', () => {
    it('has no serious or critical violations on the workflow stepper', async () => {
        mocks.stages = [
            stage({ id: 'creation', label: 'Project', complete: true, detail: 'A project' }),
            stage({ id: 'script', label: 'Script' }),
            stage({
                id: 'script-edit',
                label: 'Script edit',
                blockedReason: 'Generate the script first',
            }),
            stage({ id: 'preview', label: 'Preview', tab: 'preview' }),
        ];

        const { container } = render(<WorkflowStepper projectId="p1" />);
        const results = await axe.run(container, {
            rules: { 'color-contrast': { enabled: false } },
        });

        expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
    });

    it('has no serious or critical violations on the preview panel', async () => {
        mocks.project = { data: { _id: 'p1', title: 'A project' }, isLoading: false };
        mocks.scripts = {
            data: [
                {
                    id: 's1',
                    version: 1,
                    wordCount: 10,
                    sections: [{ order: 0, label: 'Hook', content: 'Hello' }],
                    isDeleted: false,
                    createdAt: '2026-11-01T00:00:00.000Z',
                },
            ],
            isLoading: false,
        };

        const { container } = render(<PreviewPanel projectId="p1" />);
        const results = await axe.run(container, {
            rules: { 'color-contrast': { enabled: false } },
        });

        expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
    });
});
