// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { PreviewPanel } from './preview-panel';

const mocks = vi.hoisted(() => ({
    project: { data: { _id: 'p1', title: 'A project' }, isLoading: false },
    scripts: { data: [] as unknown[], isLoading: false },
    thumbnails: { data: [] as unknown[], isLoading: false },
    media: { data: { data: [] as unknown[] }, isLoading: false },
    audio: { data: [] as unknown[], isLoading: false },
}));

vi.mock('../../hooks/use-projects', () => ({
    useProject: () => mocks.project,
}));
vi.mock('@/features/scripts/hooks/use-scripts', () => ({
    useProjectScripts: () => mocks.scripts,
}));
vi.mock('@/features/thumbnails/hooks/use-thumbnails', () => ({
    useProjectThumbnails: () => mocks.thumbnails,
}));
vi.mock('@/features/media/hooks/use-media', () => ({
    useProjectMedia: () => mocks.media,
}));
vi.mock('@/features/audio/hooks/use-audio', () => ({
    useProjectAudio: () => mocks.audio,
}));

beforeEach(() => {
    mocks.project = { data: { _id: 'p1', title: 'A project' }, isLoading: false };
    mocks.scripts = { data: [], isLoading: false };
    mocks.thumbnails = { data: [], isLoading: false };
    mocks.media = { data: { data: [] }, isLoading: false };
    mocks.audio = { data: [], isLoading: false };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('preview panel (P11.3)', () => {
    it('says plainly that there is nothing to preview yet', () => {
        render(<PreviewPanel projectId="p1" />);

        expect(screen.getByText('Nothing to preview yet')).toBeTruthy();
    });

    it('lists what is still missing instead of hiding it', () => {
        mocks.scripts = {
            data: [
                {
                    id: 's1',
                    version: 2,
                    wordCount: 42,
                    sections: [{ order: 0, label: 'Hook', content: 'Hello there' }],
                    isDeleted: false,
                    createdAt: '2026-11-01T00:00:00.000Z',
                },
            ],
            isLoading: false,
        };

        render(<PreviewPanel projectId="p1" />);

        expect(screen.getByText(/Still missing: thumbnail, scene images, narration/i)).toBeTruthy();
        expect(screen.getByText('Hello there')).toBeTruthy();
        expect(screen.getByText('Hook')).toBeTruthy();
    });

    it('assembles the script, the images and the narration when they exist', () => {
        mocks.scripts = {
            data: [
                {
                    id: 's1',
                    version: 2,
                    wordCount: 42,
                    sections: [{ order: 0, label: 'Hook', content: 'Hello there' }],
                    isDeleted: false,
                    createdAt: '2026-11-01T00:00:00.000Z',
                },
            ],
            isLoading: false,
        };
        mocks.thumbnails = {
            data: [
                {
                    id: 't1',
                    status: 'completed',
                    imageUrl: 'https://res.cloudinary.com/x/thumb.png',
                    createdAt: '2026-11-01T00:00:00.000Z',
                },
            ],
            isLoading: false,
        };
        mocks.media = {
            data: {
                data: [
                    {
                        _id: 'm1',
                        title: 'Scene 1',
                        category: 'image',
                        fileUrl: 'https://res.cloudinary.com/x/img.png',
                        metadata: { slot: 0 },
                    },
                ],
            },
            isLoading: false,
        };
        mocks.audio = {
            data: [
                {
                    id: 'a1',
                    assetType: 'narration',
                    fileUrl: 'https://res.cloudinary.com/x/narration.mp3',
                    isDeleted: false,
                },
            ],
            isLoading: false,
        };

        render(<PreviewPanel projectId="p1" />);

        expect(screen.queryByText(/Still missing/i)).toBeNull();
        expect(screen.getByAltText('Project thumbnail')).toBeTruthy();
        expect(screen.getByAltText('Scene 1')).toBeTruthy();
        expect(screen.getByLabelText('Narration playback')).toBeTruthy();
    });

    it('shows a skeleton while the assets load', () => {
        mocks.scripts = { data: [], isLoading: true };
        render(<PreviewPanel projectId="p1" />);

        expect(screen.getByLabelText('Loading preview')).toBeTruthy();
    });
});
