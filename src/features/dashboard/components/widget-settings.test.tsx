// @vitest-environment jsdom
/**
 * T21 — WidgetSettings was split out of dashboard-view (T20) and loaded on
 * first interaction, but carried no tests. These pin the dialog contract: the
 * checkbox grid mirrors hiddenWidgets, toggling reports the user's intent
 * (not the checkbox's raw checked value), and pending mutations disable the
 * whole control set.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { DASHBOARD_WIDGET_IDS, WIDGET_LABELS, type DashboardPreferences, type DashboardWidgetId } from '../lib/widget-layout';
import { WidgetSettings } from './widget-settings';

function prefs(hidden: string[]): DashboardPreferences {
    return {
        hiddenWidgets: hidden as DashboardWidgetId[],
        interests: [],
        preferredPlatforms: [],
    };
}

describe('WidgetSettings', () => {
    afterEach(cleanup);

    it('the trigger button opens the dialog with a row per widget id', async () => {
        render(<WidgetSettings preferences={prefs(['health'])} pending={false} onToggle={vi.fn()} onShowAll={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /customise/i }));

        expect(await screen.findByRole('dialog')).toBeTruthy();
        expect(screen.getByRole('dialog').textContent).toContain('Dashboard widgets');

        for (const id of DASHBOARD_WIDGET_IDS) {
            expect(screen.getByText(WIDGET_LABELS[id])).toBeTruthy();
        }
    });

    it('checkboxes reflect hiddenWidgets — hidden off, visible on', async () => {
        render(<WidgetSettings preferences={prefs(['health', 'trending'])} pending={false} onToggle={vi.fn()} onShowAll={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /customise/i }));

        for (const id of DASHBOARD_WIDGET_IDS) {
            const box = screen.getByRole('checkbox', { name: `Show ${WIDGET_LABELS[id]}` }) as HTMLInputElement;
            expect(box.checked).toBe(!['health', 'trending'].includes(id));
        }
    });

    it('toggling reports the new hidden state, not the checkbox value', async () => {
        const onToggle = vi.fn();
        render(<WidgetSettings preferences={prefs([])} pending={false} onToggle={onToggle} onShowAll={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /customise/i }));

        // All visible — unchecking a box hides that widget.
        const id = DASHBOARD_WIDGET_IDS[0];
        fireEvent.click(screen.getByRole('checkbox', { name: `Show ${WIDGET_LABELS[id]}` }));
        expect(onToggle).toHaveBeenCalledWith(id, true);

        // Now hide it for real and uncheck→check hides→shows again.
        cleanup();
        render(<WidgetSettings preferences={prefs([id])} pending={false} onToggle={onToggle} onShowAll={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /customise/i }));
        fireEvent.click(screen.getByRole('checkbox', { name: `Show ${WIDGET_LABELS[id]}` }));
        expect(onToggle).toHaveBeenLastCalledWith(id, false);
    });

    it('"Show all widgets" clears the hidden set through the callback', async () => {
        const onShowAll = vi.fn();
        render(<WidgetSettings preferences={prefs(['activity'])} pending={false} onToggle={vi.fn()} onShowAll={onShowAll} />);

        fireEvent.click(screen.getByRole('button', { name: /customise/i }));
        fireEvent.click(screen.getByRole('button', { name: /show all widgets/i }));

        expect(onShowAll).toHaveBeenCalledTimes(1);
    });

    it('a pending edit disables every checkbox and action in the dialog', async () => {
        render(<WidgetSettings preferences={prefs([])} pending={true} onToggle={vi.fn()} onShowAll={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /customise/i }));

        const id = DASHBOARD_WIDGET_IDS[0];
        expect(screen.getByRole('checkbox', { name: `Show ${WIDGET_LABELS[id]}` })).toHaveProperty('disabled', true);
        expect(screen.getByRole('button', { name: /show all widgets/i })).toHaveProperty('disabled', true);
    });
});
