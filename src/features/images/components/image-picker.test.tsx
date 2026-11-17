// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ImagePicker } from './image-picker';
import enMedia from '../../../../messages/en/media.json';
import arMedia from '../../../../messages/ar/media.json';
import type { UnsplashAssetMetadata, UnsplashPhoto } from '../types';

const mocks = vi.hoisted(() => ({
    search: vi.fn(),
    select: vi.fn(),
    trackDownload: vi.fn(),
}));

vi.mock('../services/images.service', () => ({
    imagesService: {
        search: mocks.search,
        select: mocks.select,
        trackDownload: mocks.trackDownload,
    },
}));

const PHOTO: UnsplashPhoto = {
    photoId: 'eOLpJytrbsQ',
    imageUrl: 'https://images.unsplash.com/photo-1?ixid=abc&w=1080',
    thumbnailUrl: 'https://images.unsplash.com/photo-1?ixid=abc&w=200',
    rawUrl: 'https://images.unsplash.com/photo-1?ixid=abc',
    photographerName: 'Jeff Sheldon',
    photographerUsername: 'ugmonk',
    photographerProfileUrl: 'https://unsplash.com/ugmonk?utm_source=c0c&utm_medium=referral',
    photoPageUrl: 'https://unsplash.com/photos/eOLpJytrbsQ?utm_source=c0c&utm_medium=referral',
    downloadLocation: 'https://api.unsplash.com/photos/eOLpJytrbsQ/download',
    altDescription: 'man in black crew neck t-shirt drinking coffee',
    description: 'A man drinking a coffee.',
    width: 4000,
    height: 3000,
    color: '#A7A2A1',
    blurHash: 'LaLXMa9Fx[D%~q%MtQM|kDRjtRIU',
    source: 'unsplash',
};

const meta = (overrides: Partial<{ total: number; totalPages: number; hasNextPage: boolean }> = {}) => ({
    page: 1,
    limit: 20,
    total: 133,
    totalPages: 7,
    hasNextPage: false,
    hasPrevPage: false,
    ...overrides,
});

const renderPicker = (
    props: {
        selected?: UnsplashAssetMetadata | null;
        onSelect?: (photo: UnsplashPhoto) => void;
        onClear?: () => void;
    } = {},
    locale: 'en' | 'ar' = 'en',
    messages: Record<string, unknown> = { media: enMedia }
) => {
    return render(
        <NextIntlClientProvider locale={locale} messages={messages}>
            <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                <ImagePicker
                    selected={props.selected ?? null}
                    onSelect={props.onSelect ?? (() => undefined)}
                    onClear={props.onClear}
                />
            </QueryClientProvider>
        </NextIntlClientProvider>
    );
};

beforeEach(() => {
    vi.clearAllMocks();
    mocks.search.mockResolvedValue({ data: [PHOTO], meta: meta() });
    mocks.select.mockResolvedValue(PHOTO);
});

const openDialog = async (triggerName: RegExp = /choose a photo/i) => {
    fireEvent.click(screen.getByRole('button', { name: triggerName }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
};

describe('ImagePicker', () => {
    it('shows the idle state before anything is searched for', async () => {
        renderPicker();
        await openDialog();
        expect(screen.getByText('Search for a photo')).toBeTruthy();
        expect(mocks.search).not.toHaveBeenCalled();
    });

    it('does not search for an empty term', async () => {
        renderPicker();
        await openDialog();
        fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
        expect(mocks.search).not.toHaveBeenCalled();
    });

    it('searches and lists the results with the photographer', async () => {
        renderPicker();
        await openDialog();

        fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'coffee' } });
        fireEvent.click(screen.getByRole('button', { name: /^search$/i }));

        await waitFor(() => expect(mocks.search).toHaveBeenCalled());
        expect(mocks.search.mock.calls[0]![0]).toMatchObject({ query: 'coffee', page: 1 });
        expect(await screen.findByText('Jeff Sheldon')).toBeTruthy();
    });

    it('shows the empty state when nothing matches', async () => {
        mocks.search.mockResolvedValue({ data: [], meta: meta({ total: 0, totalPages: 0 }) });
        renderPicker();
        await openDialog();

        fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'zzzz' } });
        fireEvent.click(screen.getByRole('button', { name: /^search$/i }));

        expect(await screen.findByText('No photos found')).toBeTruthy();
    });

    it('shows the error state when the search fails', async () => {
        mocks.search.mockRejectedValue(new Error('boom'));
        renderPicker();
        await openDialog();

        fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'coffee' } });
        fireEvent.click(screen.getByRole('button', { name: /^search$/i }));

        expect(await screen.findByText('Could not reach Unsplash')).toBeTruthy();
    });

    it('records the download and reports the picked photo', async () => {
        const onSelect = vi.fn();
        renderPicker({ onSelect });
        await openDialog();

        fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'coffee' } });
        fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
        await screen.findByText('Jeff Sheldon');

        fireEvent.click(screen.getByRole('button', { name: /jeff sheldon/i }));

        await waitFor(() => expect(mocks.select).toHaveBeenCalledWith('eOLpJytrbsQ'));
        await waitFor(() => expect(onSelect).toHaveBeenCalledWith(PHOTO));
    });

    it('never picks a photo for the user — a result is not a selection', async () => {
        const onSelect = vi.fn();
        renderPicker({ onSelect });
        await openDialog();

        fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'coffee' } });
        fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
        await screen.findByText('Jeff Sheldon');

        expect(onSelect).not.toHaveBeenCalled();
        expect(mocks.select).not.toHaveBeenCalled();
    });

    it('credits the photographer with links back to Unsplash', async () => {
        renderPicker({
            selected: {
                source: 'unsplash',
                photoId: PHOTO.photoId,
                imageUrl: PHOTO.imageUrl,
                thumbnailUrl: PHOTO.thumbnailUrl,
                photographerName: PHOTO.photographerName,
                photographerProfileUrl: PHOTO.photographerProfileUrl,
                photoPageUrl: PHOTO.photoPageUrl,
            },
        });
        await openDialog();

        const photographer = screen.getByRole('link', { name: 'Jeff Sheldon' });
        expect(photographer.getAttribute('href')).toContain('utm_source=c0c');
        expect(photographer.getAttribute('href')).toContain('utm_medium=referral');
        const platform = screen.getByRole('link', { name: 'Unsplash' });
        expect(platform.getAttribute('href')).toContain('utm_source=c0c');
    });

    it('offers "load more" while there is another page', async () => {
        mocks.search.mockResolvedValue({ data: [PHOTO], meta: meta({ hasNextPage: true }) });
        renderPicker();
        await openDialog();

        fireEvent.change(screen.getByLabelText('Search photos'), { target: { value: 'coffee' } });
        fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
        await screen.findByText('Jeff Sheldon');

        fireEvent.click(screen.getByRole('button', { name: /load more/i }));
        await waitFor(() => expect(mocks.search).toHaveBeenCalledTimes(2));
        expect(mocks.search.mock.calls[1]![0]).toMatchObject({ page: 2 });
    });

    it('clears the selected photo', async () => {
        const onClear = vi.fn();
        renderPicker({
            onClear,
            selected: {
                source: 'unsplash',
                photoId: PHOTO.photoId,
                imageUrl: PHOTO.imageUrl,
                photographerName: PHOTO.photographerName,
            },
        });
        await openDialog();

        fireEvent.click(screen.getByRole('button', { name: /clear/i }));
        expect(onClear).toHaveBeenCalled();
    });

    it('renders the Arabic copy for the RTL locale', async () => {
        renderPicker({}, 'ar', { media: arMedia });
        await openDialog(/اختر صورة/);
        expect(screen.getByText('ابحث عن صورة')).toBeTruthy();
        expect(screen.getByRole('button', { name: /^بحث$/ })).toBeTruthy();
    });
});
