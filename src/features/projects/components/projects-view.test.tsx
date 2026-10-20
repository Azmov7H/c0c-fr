// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ProjectsView } from './projects-view';

const mocks = vi.hoisted(() => ({
    query: '',
    replace: vi.fn(),
    push: vi.fn(),
    projects: {
        data: { data: [] as unknown[], meta: { page: 1, total: 0, totalPages: 0 } },
        isLoading: false,
        isError: false,
        error: null as unknown,
        refetch: vi.fn(),
    },
}));

vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(mocks.query),
    usePathname: () => '/projects',
    useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}));

vi.mock('../hooks/use-project-view', () => ({
    useProjectView: () => ['grid', vi.fn()] as const,
}));

vi.mock('../hooks/use-projects', () => ({
    useProjects: () => mocks.projects,
}));

describe('ProjectsView empty states', () => {
    afterEach(() => {
        cleanup();
        mocks.query = '';
        mocks.replace.mockReset();
        mocks.push.mockReset();
    });

    it('offers creation when the account has no projects at all', () => {
        render(<ProjectsView />);

        expect(screen.getByText('No projects yet')).toBeTruthy();
        expect(screen.queryByText('No projects match these filters')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /create your first project/i }));
        expect(mocks.push).toHaveBeenCalledWith('/projects/new');
    });

    it('offers to clear filters when a search matches nothing', () => {
        mocks.query = 'q=nothing-matches';
        render(<ProjectsView />);

        expect(screen.getByText('No projects match these filters')).toBeTruthy();
        expect(screen.queryByText('No projects yet')).toBeNull();
        expect(screen.getByText('Search: nothing-matches')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /^clear filters$/i }));
        expect(mocks.replace).toHaveBeenCalledWith('/projects', { scroll: false });
    });

    it('shows the archive as its own view with a way back', () => {
        mocks.query = 'status=archived';
        render(<ProjectsView />);

        expect(screen.getByText('Project archive')).toBeTruthy();
        expect(screen.getByText('No archived projects')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /back to projects/i }));
        expect(mocks.replace).toHaveBeenCalledWith('/projects', { scroll: false });
    });
});
