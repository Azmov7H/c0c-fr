// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { render } from '../../../../../tests/helpers/workspace-intl';
import { WorkspaceNotFound } from './workspace-not-found';

describe('WorkspaceNotFound', () => {
    afterEach(cleanup);

    it('renders the same not-found copy without leaking existence or permissions', () => {
        render(<WorkspaceNotFound />);

        expect(screen.getByText('Project not found')).toBeTruthy();
        const text = document.body.textContent?.toLowerCase() ?? '';
        expect(text).not.toContain('permission');
        expect(text).not.toContain('member');
        expect(text).not.toContain('forbidden');
    });
});
