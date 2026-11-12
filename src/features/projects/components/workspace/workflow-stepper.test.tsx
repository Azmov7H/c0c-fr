// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import type { StageState } from '../../lib/stages';
import { WorkflowStepper } from './workflow-stepper';

const mocks = vi.hoisted(() => ({
    stages: [] as StageState[],
    currentStageId: null as string | null,
    isLoading: false,
}));

vi.mock('../../hooks/use-workflow-stages', () => ({
    useWorkflowStages: () => ({
        stages: mocks.stages,
        currentStageId: mocks.currentStageId,
        isLoading: mocks.isLoading,
    }),
}));

const stage = (overrides: Partial<StageState> = {}): StageState => ({
    id: 'script',
    label: 'Script',
    tab: 'assets',
    ready: true,
    complete: false,
    blockedReason: null,
    detail: 'No script yet',
    ...overrides,
});

beforeEach(() => {
    mocks.stages = [
        stage({ id: 'creation', label: 'Project', complete: true, detail: 'A project' }),
        stage({ id: 'configuration', label: 'Configuration', complete: true, detail: 'youtube' }),
        stage({ id: 'script', label: 'Script', complete: false }),
        stage({ id: 'script-edit', label: 'Script edit', complete: false, blockedReason: 'Generate the script first' }),
        stage({ id: 'preview', label: 'Preview', tab: 'preview', complete: false }),
    ];
    mocks.currentStageId = 'script';
    mocks.isLoading = false;
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('workflow stepper (P11.2)', () => {
    it('renders every stage in order', () => {
        render(<WorkflowStepper projectId="p1" />);

        const links = screen.getAllByRole('link');
        expect(links.map((link) => link.textContent)).toEqual([
            expect.stringContaining('Project'),
            expect.stringContaining('Configuration'),
            expect.stringContaining('Script'),
            expect.stringContaining('Script edit'),
            expect.stringContaining('Preview'),
        ]);
    });

    it('marks the current stage for assistive tech', () => {
        render(<WorkflowStepper projectId="p1" />);

        const current = screen.getByRole('link', { name: 'Script — current step' });
        expect(current.getAttribute('aria-current')).toBe('step');
    });

    it('marks completed stages and shows what they produced', () => {
        render(<WorkflowStepper projectId="p1" />);

        const project = screen.getByRole('link', { name: 'Project — completed' });
        expect(project.textContent).toContain('A project');
    });

    it('shows WHY a stage is blocked, not a bare lock', () => {
        render(<WorkflowStepper projectId="p1" />);

        const blocked = screen.getByRole('link', { name: 'Script edit — blocked' });
        expect(blocked.textContent).toContain('Generate the script first');
    });

    it('deep-links each stage into the tab that performs it', () => {
        render(<WorkflowStepper projectId="p1" />);

        expect(
            screen.getByRole('link', { name: 'Script — current step' }).getAttribute('href')
        ).toBe('/projects/p1?stage=script');
        expect(
            screen.getByRole('link', { name: 'Preview — not started' }).getAttribute('href')
        ).toBe('/projects/p1?tab=preview&stage=preview');    });

    it('shows a skeleton while the stages are being derived', () => {
        mocks.isLoading = true;
        render(<WorkflowStepper projectId="p1" />);

        expect(screen.getByLabelText('Loading workflow stages')).toBeTruthy();
        expect(screen.queryByRole('link')).toBeNull();
    });
});
