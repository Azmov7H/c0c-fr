import { describe, expect, it } from 'vitest';

import { ADMIN_NAV_GROUPS } from './nav';
import { ADMIN_PERMISSIONS, hasAdminPermission } from './permissions';

describe('hasAdminPermission (spec §5.1 rule 1)', () => {
    it('includes present permissions', () => {
        expect(hasAdminPermission(['credits.read'], 'credits.read')).toBe(true);
        expect(hasAdminPermission([], 'credits.read')).toBe(false);
        expect(hasAdminPermission(['credits.read'], 'credits.grant')).toBe(false);
    });
});

describe('admin nav permissions (spec §2.2 + A2 contract)', () => {
    it('every nav item references a permission in the ADMIN_PERMISSIONS mirror', () => {
        const vocab = new Set(Object.keys(ADMIN_PERMISSIONS));
        const referenced = ADMIN_NAV_GROUPS.flatMap((group) =>
            group.items.flatMap((item) => item.permissions),
        );
        expect(referenced.length).toBeGreaterThan(0);
        for (const p of referenced) {
            expect(vocab.has(p), `nav item references unknown permission: ${p}`).toBe(true);
        }
    });
});
