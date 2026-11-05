'use client';

import dynamic from 'next/dynamic';

/**
 * T20: the account menu is a click target, not first-paint content.
 *
 * Splitting it keeps Radix's dropdown/avatar runtime out of the dashboard
 * first-load budget. The placeholder is the same 32px circle the avatar
 * occupies, so the header does not shift when the menu arrives after
 * hydration.
 */
const UserButton = dynamic(() => import('./user-button').then((mod) => mod.UserButton), {
    ssr: false,
    loading: () => (
        <span
            className="inline-flex size-8 shrink-0 rounded-full bg-muted"
            aria-hidden="true"
        />
    ),
});

export function UserButtonSlot() {
    return <UserButton />;
}
