// @vitest-environment jsdom
/** T18 P2: DataState is the shared four-state contract — wrong precedence
 *  here means every data-driven page inherits it (loading must win over a
 *  stale error while refetching, empty never flashes before data lands).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataState } from './data-state';

interface Props {
    isLoading?: boolean;
    error?: unknown;
    isEmpty?: boolean;
    onRetry?: () => void;
}

const Mount = (props: Props) => <DataState {...props}>content</DataState>;

afterEach(cleanup);

describe('DataState — the four states and their precedence', () => {
    it('loading renders shaped skeletons with an SR-only status, not the children', () => {
        render(<Mount isLoading />);

        expect(screen.getByRole('status')).toHaveTextContent('Loading');
        expect(screen.queryByText('content')).not.toBeInTheDocument();
        // Mirrors a list: skeleton rows, not a single spinner.
        expect(screen.getByRole('status').closest('div[data-state]')).toHaveAttribute(
            'data-state',
            'loading'
        );
    });

    it('a custom loadingFallback mirrors the content shape instead of the list skeleton', () => {
        render(<DataState isLoading loadingFallback={<div>grid skeleton</div>}>x</DataState>);

        expect(screen.getByText('grid skeleton')).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('error shows a destructive alert carrying the Error message', () => {
        render(<Mount error={new Error('Mongo is down')} />);

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Mongo is down')).toBeInTheDocument();
        expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('non-Error throwables fall back to the neutral copy instead of [object Object]', () => {
        render(<Mount error="weird" />);

        expect(screen.getByText('The data could not be loaded. Try again in a moment.')).toBeInTheDocument();
    });

    it('onRetry offers a recovery button the user can actually hit', async () => {
        const onRetry = vi.fn();
        render(<Mount error={new Error('x')} onRetry={onRetry} />);

        await userEvent.click(screen.getByRole('button', { name: /try again/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('empty renders the empty contract with the default copy', () => {
        render(<Mount isEmpty />);

        expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
        expect(screen.getByText('There is no data to show for this view.')).toBeInTheDocument();
    });

    it('emptyAction surfaces a call to action inside the empty state', async () => {
        const onClick = vi.fn();
        render(
            <DataState
                isEmpty
                emptyTitle="No projects"
                emptyAction={{ label: 'New project', onClick }}
            >
                x
            </DataState>
        );

        await userEvent.click(screen.getByRole('button', { name: 'New project' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('success renders children inside the success branch', () => {
        render(<Mount />);

        expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('precedence: loading wins over error (a refetch after failure shows the skeleton)', () => {
        render(<Mount isLoading error={new Error('stale')} />);

        expect(document.querySelector('[data-state="loading"]')).toBeTruthy();
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('precedence: error wins over empty (a broken page is not an empty page)', () => {
        render(<Mount error={new Error('x')} isEmpty />);

        expect(document.querySelector('[data-state="error"]')).toBeTruthy();
        expect(screen.queryByRole('alert')).toBeInTheDocument();
    });
});
