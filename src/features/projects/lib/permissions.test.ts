import { describe, expect, it } from 'vitest';

import { can, grantableRoles, PROJECT_ROLES } from './permissions';

describe('project permissions', () => {
    it('mirrors the backend capability matrix', () => {
        expect(can('owner', 'manage')).toBe(true);
        expect(can('editor', 'edit')).toBe(true);
        expect(can('editor', 'manage')).toBe(false);
        expect(can('commenter', 'comment')).toBe(true);
        expect(can('commenter', 'edit')).toBe(false);
        expect(can('viewer', 'read')).toBe(true);
        expect(can('viewer', 'comment')).toBe(false);
        expect(can(undefined, 'read')).toBe(false);
    });

    it('never offers owner as a grantable role', () => {
        expect(grantableRoles('owner')).toEqual(PROJECT_ROLES);
        expect(grantableRoles('owner')).not.toContain('owner');
        expect(grantableRoles('editor')).toEqual([]);
    });
});
