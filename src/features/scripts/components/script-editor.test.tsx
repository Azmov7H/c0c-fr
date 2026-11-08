// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ScriptEditor } from './script-editor';
import type { Script } from '../types';

const mocks = vi.hoisted(() => ({
    script: undefined as
        | { id: string; projectId: string; sections: Array<Record<string, unknown>>; version: number; wordCount: number; status: string }
        | undefined,
    update: vi.fn(),
    setUpdate: vi.fn(),
}));

vi.mock('../hooks/use-scripts', () => ({
    useScript: () => ({ data: mocks.script, isLoading: false }),
    useUpdateScript: () => ({ mutate: mocks.update, isPending: false }),
    useGenerateScript: () => ({ mutate: mocks.setUpdate, isPending: false }),
}));

const scriptFixture = (sections: Array<Record<string, unknown>>) =>
    ({
        id: 's1',
        projectId: 'p1',
        sections,
        version: 2,
        wordCount: 10,
        status: 'completed',
    }) as unknown as Script;

describe('ScriptEditor (P05.7)', () => {
    it('renders every scene with its per-scene fields', () => {
        mocks.script = scriptFixture([
            { order: 1, label: 'Hook', content: 'hook text', narration: 'hook narration', visualDirection: 'face cam', transition: 'fade', durationSeconds: 5, assetIds: [] },
            { order: 2, label: 'CTA', content: 'cta text', narration: 'cta narration', transition: 'cut', durationSeconds: 5 },
        ]) as never;
        render(<ScriptEditor scriptId="s1" />);
        expect(screen.getByText('Scene 1 · Hook')).toBeTruthy();
        expect(screen.getByText('Scene 2 · CTA')).toBeTruthy();
        expect(screen.getAllByLabelText('Narration (voiceover)').length).toBe(2);
        expect(screen.getAllByLabelText('Visual direction').length).toBe(2);
        expect(screen.getAllByLabelText('Transition').length).toBe(2);
        expect(screen.getAllByLabelText('Section title').length).toBe(2);
        // Asset links stay read-only with the P06/P07 note.
        expect(screen.getAllByText(/P06\/P07/).length).toBeGreaterThan(0);
        mocks.script = undefined;
    });

    it('preserves untouched scenes byte-for-byte on save (P05.6 echo)', async () => {
        mocks.script = scriptFixture([
            { order: 1, label: 'Hook', content: 'h', narration: 'h', transition: 'fade', durationSeconds: 5, assetIds: [] },
            { order: 2, label: 'CTA', content: 'c', narration: 'c', transition: 'cut', durationSeconds: 5, assetIds: [] },
        ]) as never;
        render(<ScriptEditor scriptId="s1" />);
        // Edit only the second narration field.
        const narrationFields = screen.getAllByLabelText('Narration (voiceover)');
        fireEvent.change(narrationFields[1]!, { target: { value: 'c edited' } });
        fireEvent.click(screen.getByRole('button', { name: /Save script/i }));
        // Submission is async (validation + serialize).
        await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
        const payload = mocks.update.mock.calls[0]![0];
        expect(payload.data.sections[0].content).toBe('h');
        expect(payload.data.sections[0].narration).toBe('h');
        expect(payload.data.sections[1].narration).toBe('c edited');
        mocks.script = undefined;
        mocks.update.mockClear();
    });
});
