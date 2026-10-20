// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { PaginatedResponse, Project } from '@/types';
import { projectKeys } from '../lib/query-keys';
import { useCreateProject, useDeleteProject, useUpdateProject } from './use-projects';

const mocks = vi.hoisted(() => ({
    update: vi.fn(),
    remove: vi.fn(),
    create: vi.fn(),
}));

vi.mock('../services/projects.service', () => ({
    projectsService: {
        update: mocks.update,
        delete: mocks.remove,
        create: mocks.create,
        getAll: vi.fn(),
        getById: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

const project = (overrides: Partial<Project> = {}): Project => ({
    _id: 'p1',
    title: 'Original',
    idea: 'Idea',
    platform: 'youtube',
    tone: 'educational',
    status: 'draft',
    userId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
});

let queryClient: QueryClient;
const listKey = projectKeys.list({ page: 1 });

const seed = (projects: Project[]) => {
    const response: PaginatedResponse<Project> = {
        success: true,
        data: projects,
        meta: {
            page: 1,
            limit: 12,
            total: projects.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },
    };
    queryClient.setQueryData(listKey, response);
    return response;
};

const read = () => queryClient.getQueryData<PaginatedResponse<Project>>(listKey);

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
    queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    queryClient.clear();
});

describe('optimistic project mutations', () => {
    it('patches the status immediately and rolls back when the server rejects', async () => {
        seed([project()]);
        let reject!: (error: Error) => void;
        mocks.update.mockReturnValue(
            new Promise((_resolve, rejectPromise) => {
                reject = rejectPromise;
            })
        );

        const { result } = renderHook(() => useUpdateProject(), { wrapper });

        act(() => {
            result.current.mutate({ id: 'p1', data: { status: 'completed' } });
        });

        await waitFor(() => expect(read()?.data[0]?.status).toBe('completed'));

        await act(async () => {
            reject(new Error('offline'));
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(read()?.data[0]?.status).toBe('draft');
    });

    it('removes a deleted project immediately and restores it on failure', async () => {
        seed([project()]);
        let reject!: (error: Error) => void;
        mocks.remove.mockReturnValue(
            new Promise((_resolve, rejectPromise) => {
                reject = rejectPromise;
            })
        );

        const { result } = renderHook(() => useDeleteProject(), { wrapper });

        act(() => {
            result.current.mutate('p1');
        });

        await waitFor(() => expect(read()?.data).toHaveLength(0));

        await act(async () => {
            reject(new Error('nope'));
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(read()?.data).toHaveLength(1);
        expect(read()?.data[0]?.title).toBe('Original');
    });

    it('shows an optimistic card during creation and removes it on failure', async () => {
        seed([]);
        let reject!: (error: Error) => void;
        mocks.create.mockReturnValue(
            new Promise((_resolve, rejectPromise) => {
                reject = rejectPromise;
            })
        );

        const { result } = renderHook(() => useCreateProject(), { wrapper });

        act(() => {
            result.current.mutate({
                title: 'Brand new',
                idea: 'Fresh idea',
                platform: 'tiktok',
                tone: 'viral',
            });
        });

        await waitFor(() => expect(read()?.data[0]?.title).toBe('Brand new'));
        expect(read()?.data[0]?._id).toMatch(/^optimistic-/);

        await act(async () => {
            reject(new Error('nope'));
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(read()?.data).toHaveLength(0);
    });
});
