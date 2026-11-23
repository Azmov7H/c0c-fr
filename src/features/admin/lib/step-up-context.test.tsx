// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { StepUpProvider, useSetStepUpToken, useStepUpToken } from './step-up-context';

function TokenProbe() {
    const token = useStepUpToken();
    const setToken = useSetStepUpToken();
    return (
        <div>
            <span data-testid="token">{token ?? 'none'}</span>
            <button onClick={() => setToken('tok_abc123')}>set</button>
            <button onClick={() => setToken(null)}>clear</button>
        </div>
    );
}

describe('step-up context (spec §5.1 rule 5 — memory-only token)', () => {
    it('starts empty and round-trips a minted token, then clears it', () => {
        render(
            <StepUpProvider>
                <TokenProbe />
            </StepUpProvider>,
        );
        expect(screen.getByTestId('token').textContent).toBe('none');
        fireEvent.click(screen.getByRole('button', { name: 'set' }));
        expect(screen.getByTestId('token').textContent).toBe('tok_abc123');
        fireEvent.click(screen.getByRole('button', { name: 'clear' }));
        expect(screen.getByTestId('token').textContent).toBe('none');
    });
});
