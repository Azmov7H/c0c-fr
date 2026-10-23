// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { UpgradePrompt } from './upgrade-prompt';

afterEach(cleanup);

describe('UpgradePrompt', () => {
    it('shows the exact quota, reason and upgrade action for a 429', () => {
        render(
            <UpgradePrompt
                title="Generation quota reached"
                description="You have used all 3 generations this month."
                ctaLabel="Upgrade for more generations"
                feature="ai.generation"
                used={3}
                limit={3}
                resetAt="2026-11-01T00:00:00.000Z"
            />
        );

        expect(screen.getByText('Generation quota reached')).toBeTruthy();
        expect(screen.getByText('You have used all 3 generations this month.')).toBeTruthy();
        expect(screen.getByText(/3 of 3 used · resets Nov 1, 2026/)).toBeTruthy();
        const link = screen.getByRole('link', { name: /upgrade for more generations/i });
        expect(link.getAttribute('href')).toBe('/settings/billing');
    });
});
