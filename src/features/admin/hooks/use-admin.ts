'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { adminService } from '../services/admin.service';
import type { AdminMe } from '../types';

export const adminKeys = {
    me: ['admin', 'me'] as const,
};

/** Effective identity + permissions for the current admin session. */
export function useAdminMe(): UseQueryResult<AdminMe> {
    return useQuery({
        queryKey: adminKeys.me,
        queryFn: () => adminService.me(),
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });
}

/**
 * The effective permission set (spec §5.1 rule 1). Empty while `/admin/me` is
 * loading — nav filters to nothing, which is the right default for a role we
 * do not yet know.
 */
export function useAdminPermissions(): string[] {
    const { data } = useAdminMe();
    return data?.permissions ?? [];
}
