// @vitest-environment jsdom
import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { OptionGrid } from './option-grid';
import {
    ExperienceStep,
    NicheStep,
    PlatformsStep,
    SubtopicsStep,
    shouldOfferSearch,
} from './step-panels';
import { emptyDraft } from '../lib/onboarding-draft';
import { longOptions, testOptions } from '../lib/test-fixtures';

afterEach(() => cleanup());

describe('shouldOfferSearch', () => {
    it('turns on only past ~15 options', () => {
        expect(shouldOfferSearch(15)).toBe(false);
        expect(shouldOfferSearch(16)).toBe(true);
    });
});

describe('step panels', () => {
    it('shows no search field for the short niche list', () => {
        render(<NicheStep draft={emptyDraft} options={testOptions} onChange={() => {}} />);
        expect(screen.queryByRole('searchbox')).toBeNull();
        expect(screen.getAllByRole('radio')).toHaveLength(testOptions.niches.length);
    });

    it('adds search when the list is long (subtopics)', () => {
        render(
            <SubtopicsStep
                draft={{ ...emptyDraft, niche: 'alpha' }}
                options={longOptions}
                onChange={() => {}}
            />
        );
        expect(screen.getByRole('searchbox')).toBeTruthy();
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Fixture topic 39' } });
        expect(screen.getAllByRole('checkbox')).toHaveLength(1);
        expect(screen.getByText('Fixture topic 39')).toBeTruthy();
    });

    it('announces the selected state through aria-checked', () => {
        render(
            <OptionGrid
                mode="single"
                label="Niche"
                options={[{ value: 'tech', label: 'Tech' }]}
                selected={['tech']}
                onToggle={() => {}}
            />
        );
        expect(screen.getByRole('radio', { name: 'Tech' }).getAttribute('aria-checked')).toBe('true');
    });

    it('renders platforms as a multi-select and always allows deselecting', () => {
        const { rerender } = render(
            <PlatformsStep
                draft={{ ...emptyDraft, platforms: ['youtube', 'tiktok', 'instagram'] }}
                options={testOptions}
                onChange={() => {}}
            />
        );
        const boxes = screen.getAllByRole('checkbox');
        for (const box of boxes) {
            expect(box.getAttribute('aria-checked')).toBe('true');
            // At the cap the chosen items stay enabled so they can be undone.
            expect((box as HTMLButtonElement).disabled).toBe(false);
        }

        rerender(
            <PlatformsStep
                draft={{ ...emptyDraft, platforms: ['youtube'] }}
                options={testOptions}
                onChange={() => {}}
            />
        );
        const instagram = screen.getByRole('checkbox', { name: 'Instagram' });
        expect((instagram as HTMLButtonElement).disabled).toBe(false);
    });

    it('renders experience as single-choice radios', () => {
        render(
            <ExperienceStep
                draft={{ ...emptyDraft, experience: 'starter' }}
                options={testOptions}
                onChange={() => {}}
            />
        );
        const selected = screen.getByRole('radio', { name: /Just starting out/ });
        expect(selected.getAttribute('aria-checked')).toBe('true');
    });
});
