// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { MediaWorkspace } from './media-workspace';

const mocks = vi.hoisted(() => ({
    audio: [] as Array<Record<string, unknown>>,
    update: vi.fn(),
    generate: vi.fn(),
    setGenerate: vi.fn(),
}));

vi.mock('@/features/projects/hooks/use-projects', () => ({
    useProjects: () => ({ data: { data: [] } }),
}));
vi.mock('@/features/media/hooks/use-media', () => ({
    useProjectMedia: () => ({ data: { data: [] }, isLoading: false }),
    useMediaAllowance: () => ({ data: { thumbnail: { used: 0, limit: null }, images: { used: 0, limit: null } } }),
    useRegenerateMedia: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/features/thumbnails/hooks/use-thumbnails', () => ({
    useProjectThumbnails: () => ({ data: [], isLoading: false }),
    useRegenerateThumbnail: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/features/audio/hooks/use-audio', () => ({
    useProjectAudio: () => ({ data: mocks.audio, isLoading: false }),
    useGenerateAudio: () => ({ mutate: mocks.setGenerate, isPending: false }),
    useUpdateAudioSuggestion: () => ({ mutate: mocks.update, isPending: false }),
}));

const row = (overrides: object = {}) =>
    ({
        id: 'a1',
        projectId: 'p1',
        assetType: 'narration',
        fileUrl: 'https://dashscope-intl.aliyuncs.com/n.mp3',
        durationSeconds: 30,
        format: 'mp3',
        source: 'generated',
        isCurrent: true,
        volume: 1,
        enabled: true,
        ...overrides,
    }) as never;

describe('MediaWorkspace audio layers (P06.7)', () => {
    it('splits narration / music / sfx into separate panels', () => {
        mocks.audio = [
            row({ id: 'n1', assetType: 'narration' }),
            row({ id: 'm1', assetType: 'music', fileUrl: undefined }),
            row({ id: 's1', assetType: 'sfx', fileUrl: undefined }),
        ];
        render(<MediaWorkspace projectId="p1" />);
        expect(screen.getByText('Narration')).toBeTruthy();
        expect(screen.getByText('Music')).toBeTruthy();
        expect(screen.getByText('Sound effects')).toBeTruthy();
        expect(screen.getAllByLabelText(/Volume/).length).toBe(3);
        // Regenerate exists per panel.
        expect(screen.getAllByRole('button', { name: /Regenerate/i }).length).toBe(3);
        mocks.audio = [];
    });

    it('legacy combined row shows under narration with an upgrade note', () => {
        mocks.audio = [row({ id: 'legacy1', assetType: undefined })];
        render(<MediaWorkspace projectId="p1" />);
        expect(screen.getByText('Narration')).toBeTruthy();
        expect(screen.getByText(/regenerate to split them/)).toBeTruthy();
        mocks.audio = [];
    });

    it('volume + enable persist via update (P06.4)', () => {
        mocks.audio = [row({ id: 'n1' })];
        render(<MediaWorkspace projectId="p1" />);
        const volume = screen.getByLabelText('Volume (100%)');
        fireEvent.change(volume, { target: { value: '0.5' } });
        expect(mocks.update).toHaveBeenCalledWith({ id: 'n1', data: { volume: 0.5 } });
        const toggle = screen.getByLabelText('Enable Narration');
        fireEvent.click(toggle);
        expect(mocks.update).toHaveBeenCalledWith({ id: 'n1', data: { enabled: false } });
        mocks.audio = [];
        mocks.update.mockClear();
    });
});
