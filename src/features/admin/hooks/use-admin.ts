'use client';

import {
    useAdminMe as useAdminMeContext,
    useRefreshAdminMe as useRefreshAdminMeContext,
} from '../components/admin-me-provider';
import type { AdminMe } from '../types';

/** Effective identity + permissions, bootstrapped by the layout (/admin/me). */
export function useAdminMe(): AdminMe | undefined {
    return useAdminMeContext();
}

/** Re-fetch /admin/me after the server state may have changed (spec §5.1 rule 6). */
export function useRefreshAdminMe(): () => Promise<void> {
    return useRefreshAdminMeContext();
}

/**
 * The effective permission set (spec §5.1 rule 1). Empty while /admin/me is
 * unavailable.
 */
export function useAdminPermissions(): string[] {
    const me = useAdminMe();
    return me?.permissions ?? [];
}
