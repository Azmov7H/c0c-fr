// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { useBreadcrumbStore } from './breadcrumb-store';

/**
 * T16 — the workspace registers its loaded project title here, and the shell
 * header substitutes it for the breadcrumb segment. The clear must be
 * id-scoped: navigating from project A to project B must not blank the
 * breadcrumb while A's cleanup races B's mount.
 */
describe('breadcrumb-store', () => {
    beforeEach(() => {
        useBreadcrumbStore.setState({ projectId: null, projectTitle: null });
    });

    it('registers the loaded project id and title', () => {
        useBreadcrumbStore.getState().setProject('proj-1', 'Landing page teardown');
        expect(useBreadcrumbStore.getState()).toMatchObject({
            projectId: 'proj-1',
            projectTitle: 'Landing page teardown',
        });
    });

    it('a clear with the WRONG id is a no-op (project-B mount must not blank the seam)', () => {
        useBreadcrumbStore.getState().setProject('proj-1', 'Title 1');
        useBreadcrumbStore.getState().clearProject('proj-other');
        expect(useBreadcrumbStore.getState().projectTitle).toBe('Title 1');
    });

    it('a clear with the matching id resets both fields', () => {
        useBreadcrumbStore.getState().setProject('proj-1', 'Title 1');
        useBreadcrumbStore.getState().clearProject('proj-1');
        expect(useBreadcrumbStore.getState().projectId).toBeNull();
        expect(useBreadcrumbStore.getState().projectTitle).toBeNull();
    });
});
