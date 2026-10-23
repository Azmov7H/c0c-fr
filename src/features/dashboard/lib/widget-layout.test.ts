import { describe, expect, it } from 'vitest';

import type { Platform } from '@/types';

import {
    DASHBOARD_WIDGET_IDS,
    EMPTY_PREFERENCES,
    defaultWidgetOrder,
    normalisePreferences,
    orderPlatforms,
    visibleWidgets,
    widgetLock,
} from './widget-layout';

const personalised = {
    hiddenWidgets: [],
    interests: ['ai-tools'],
    preferredPlatforms: ['tiktok'] as Platform[],
};

describe('dashboard widget layout', () => {
    it('pins metrics and projects first', () => {
        const order = defaultWidgetOrder(EMPTY_PREFERENCES);
        expect(order.slice(0, 2)).toEqual(['stats', 'projects']);
    });

    it('moves the personalised trend feed up when interests or platforms exist', () => {
        const generic = defaultWidgetOrder(EMPTY_PREFERENCES);
        const personal = defaultWidgetOrder({ ...personalised, preferredPlatforms: ['tiktok'] });

        expect(generic.indexOf('trending')).toBeGreaterThan(generic.indexOf('activity'));
        expect(personal.indexOf('trending')).toBeLessThan(personal.indexOf('activity'));
        expect(personal.indexOf('trending')).toBeLessThan(personal.indexOf('platforms'));
    });

    it('filters hidden widgets without changing the rest of the order', () => {
        const prefs = {
        ...personalised,
        preferredPlatforms: ['tiktok'] as Platform[],
        hiddenWidgets: ['activity' as const],
    };
        const visible = visibleWidgets(prefs);

        expect(visible).not.toContain('activity');
        expect(visible[0]).toBe('stats');
        expect(visible).toHaveLength(DASHBOARD_WIDGET_IDS.length - 1);
    });

    it('orders platforms by stated preference', () => {
        expect(orderPlatforms(['instagram'])).toEqual(['instagram', 'youtube', 'tiktok']);
    });

    it('keeps locked widgets visible with a reason and upgrade path', () => {
        expect(widgetLock('analytics', false)).toMatchObject({
            locked: true,
            upgradeHref: '/settings/billing',
        });
        expect(widgetLock('analytics', true).locked).toBe(false);
        expect(widgetLock('analytics', undefined).locked).toBe(false);
    });

    it('drops unknown ids from persisted preferences', () => {
        const normalised = normalisePreferences({
            hiddenWidgets: ['stats', 'nope', 'stats'] as never,
            interests: ['x'],
            preferredPlatforms: [],
        });

        expect(normalised.hiddenWidgets).toEqual(['stats']);
    });
});
