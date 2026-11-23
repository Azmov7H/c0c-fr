'use client';

import type { ReactNode } from 'react';

import { useAdminPermissions } from '../hooks/use-admin';

/**
 * Spec §5.1 rule 2 — renders children only if the permission is present.
 *
 * UX only (spec §5.1): the backend re-checks every call. For read-only
 * controls the spec §5.2 wants, pages use `ReadOnlyBanner` / a tooltip, not
 * an empty button.
 */
export function PermissionGate({
    permission,
    children,
}: {
    permission: string;
    children: ReactNode;
}) {
    const permissions = useAdminPermissions();
    if (!permissions.includes(permission)) return null;
    return <>{children}</>;
}
