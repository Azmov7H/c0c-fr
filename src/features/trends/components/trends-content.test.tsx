// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TrendsContent } from './trends-content';
import type { TrendFeed } from '../types';

const mocks = vi.hoisted(() => ({
    feed: {
        data: undefined as TrendFeed | undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    },
}));

vi.mock('../hooks/use-trends', () => ({
    useGlobalTrendFeed: () => mocks.feed,
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const measuredFeed = (overrides: object = {}): TrendFeed =>
    ({
        scope: 'global',
        windowDays: 7,
        computedAt: '2026-11-08T10:00:00.000Z',
        fetchedAt: '2026-11-08T10:00:00.000Z',
        freshness: 'fresh',
        provider: 'internal-db',
        providerStatus: 'ok',
        source: 'measured',
        topics: [
            {
                topic: 'AI & ML',
                rank: 1,
                viralScore: 100,
                components: { demand: 100, supply: 100, engagement: 100, velocity: 100 },
                measuredComponents: ['demand'],
                projectCount: 3,
                keywordCount: 2,
                avgEngagement: 80,
                growthPct: 200,
                platforms: ['youtube'],
                relatedTopics: [],
                creatorCount: 2,
                source: 'measured',
                category: 'tech',
            },
        ],
        ...overrides,
    }) as TrendFeed;

describe('TrendsContent (P03)', () => {
    it('renders the measured feed with provenance, never projected reports as live', () => {
        mocks.feed.data = measuredFeed();
        mocks.feed.isLoading = false;
        mocks.feed.isError = false;
        render(<TrendsContent />);
        expect(screen.getByText('Ideas & Trends')).toBeTruthy();
        expect(screen.getByText('AI & ML')).toBeTruthy();
        expect(screen.getByText(/measured demand/)).toBeTruthy();
        expect(screen.getByText(/Measured · internal-db/)).toBeTruthy();
        // Fake mock showcase is gone (dev mock fallback removed).
        expect(screen.queryByText('AI Video Generation')).toBeNull();
        expect(screen.queryByText(/24h/)).toBeNull();
    });

    it('shows a stale snapshot banner, not a live claim', () => {
        mocks.feed.data = measuredFeed({ freshness: 'stale', providerStatus: 'stale' });
        render(<TrendsContent />);
        expect(screen.getAllByText(/Stale snapshot/).length).toBeGreaterThan(0);
    });

    it('provider unavailable is a visible empty state, never invented topics', () => {
        mocks.feed.data = measuredFeed({ topics: [], providerStatus: 'unavailable', computedAt: null, fetchedAt: null });
        render(<TrendsContent />);
        expect(screen.getByText('Provider unavailable')).toBeTruthy();
        expect(screen.queryByText('AI & ML')).toBeNull();
    });

    it('empty window shows a reason, not a blank page', () => {
        mocks.feed.data = measuredFeed({ topics: [] });
        render(<TrendsContent />);
        expect(screen.getByText('No trends for this window')).toBeTruthy();
    });
});
