import { describe, expect, it } from 'vitest';

import { getActiveAdminNavUrl } from './active-nav';

describe('getActiveAdminNavUrl (admin sidebar, spec §2.2)', () => {
    it('matches the nav URL for a page path', () => {
        expect(getActiveAdminNavUrl('/admin/users')).toBe('/admin/users');
        expect(getActiveAdminNavUrl('/admin')).toBe('/admin');
    });

    it('matches the parent item for a detail path', () => {
        expect(getActiveAdminNavUrl('/admin/users/6710abc')).toBe('/admin/users');
    });

    it('matches across the locale prefix', () => {
        expect(getActiveAdminNavUrl('/en/admin/credits')).toBe('/admin/credits');
    });

    it('returns undefined off-admin paths', () => {
        expect(getActiveAdminNavUrl('/dashboard')).toBeUndefined();
        expect(getActiveAdminNavUrl('/admin-something')).toBeUndefined();
    });
});
