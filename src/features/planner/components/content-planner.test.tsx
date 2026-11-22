// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import enPlanner from '../../../../messages/en/planner.json';
import { ContentPlanner } from './content-planner';

const event = {
    _id: 'evt-1',
    userId: 'u1',
    projectId: 'proj-1',
    title: 'Publish episode 7',
    type: 'publish' as const,
    status: 'pending' as const,
    scheduledDate: '2026-11-10T20:00:00.000Z',
    timezone: 'Asia/Dubai',
    scheduledDay: '2026-11-11',
    reminders: ['2026-11-10T18:00:00.000Z'],
    createdAt: '2026-11-09T00:00:00.000Z',
    updatedAt: '2026-11-09T00:00:00.000Z',
};

const mocks = vi.hoisted(() => ({
    events: {
        data: undefined as unknown,
        isLoading: false,
        error: undefined as unknown | undefined,
        refetch: vi.fn(),
    },
}));

vi.mock('@/features/projects/hooks/use-projects', () => ({
    useProjects: () => ({ data: { data: [] } }),
}));
vi.mock('@/features/planner/hooks/use-planner', () => ({
    usePlannerEvents: () => mocks.events,
}));
vi.mock('@/i18n/locale', () => ({
    useUrlLocale: () => 'en',
}));

function renderUi() {
    return render(
        <NextIntlClientProvider locale="en" messages={{ planner: enPlanner }}>
            <ContentPlanner />
        </NextIntlClientProvider>
    );
}

it('calendar cell and mobile list show the same scheduledDay for one event', () => {
    mocks.events.data = { data: [event], meta: {} };
    renderUi();

    const list = document.querySelector('[data-testid="planner-list"]') as HTMLElement;
    expect(within(list).getByText('Publish episode 7')).toBeTruthy();
    expect(list.textContent).toContain('2026-11-11');
    expect(list.textContent).toContain('Asia/Dubai');

    const cell = document.querySelector('[data-day="2026-11-11"]') as HTMLElement;
    expect(cell).not.toBeNull();
    expect(within(cell).getByText('Publish episode 7')).toBeTruthy();

    expect(list.textContent).toContain('not dispatched yet');
});

it('renders the empty state through DataState when the month has no events', () => {
    mocks.events.data = { data: [], meta: {} };
    renderUi();
    expect(screen.getByText('Nothing scheduled this month')).toBeTruthy();
});

it('exposes a retry affordance when the query fails', () => {
    mocks.events.error = new Error('planner down');
    renderUi();
    const retry = screen.getAllByRole('button').find((b) => /try again/i.test(b.textContent || ''));
    expect(retry).toBeTruthy();
    mocks.events.error = undefined;
});
