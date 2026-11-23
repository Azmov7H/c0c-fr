/**
 * Active-item matching for the admin sidebar (spec §2.2, §7.2).
 *
 * `stripLocaleFromPath` (c0c-bake convention, shared via `@/i18n/routing`)
 * keeps the match list in plain form (`/admin/users`, not `/en/admin/users`).
 * A detail page matches its list parent: `/admin/users/<id>` is active on the
 * Users item. The longest matching URL wins.
 */
import { stripLocaleFromPath } from '@/i18n/routing';

import { ADMIN_NAV_GROUPS } from './nav';

export function getActiveAdminNavUrl(pathname: string): string | undefined {
    const path = stripLocaleFromPath(pathname);
    let active: { url: string } | undefined;
    for (const group of ADMIN_NAV_GROUPS) {
        for (const item of group.items) {
            if (path === item.url || path.startsWith(`${item.url}/`)) {
                if (!active || item.url.length > active.url.length) active = item;
            }
        }
    }
    return active?.url;
}
