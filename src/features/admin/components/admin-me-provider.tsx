'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/api-error';
import apiClient from '@/services/api-client';
import type { ApiResponse } from '@/services/api-client';

import type { AdminMe } from '../types';

interface AdminMeContextValue {
    me: AdminMe;
    /** Re-fetch /admin/me — spec §5.1 rule 6 (refresh once after a 403). */
    refresh: () => Promise<void>;
}

const AdminMeContext = createContext<AdminMeContextValue | null>(null);

/**
 * `/admin/me` bootstrap (spec §2.4, §5.1 rules 1–2).
 *
 * The server layout fetches /admin/me authoritatively and hands the value to
 * this provider; the client mirrors it so any admin surface (shell, nav,
 * dialogs) reads the same bootstrapped identity. `refresh` re-fetches the
 * authoritative value (e.g. after a role changed server-side).
 */
export function AdminMeProvider({ value, children }: { value: AdminMe; children: ReactNode }) {
    const [me, setMe] = useState<AdminMe>(value);

    const refresh = useCallback(async () => {
        try {
            const response = await apiClient.get<ApiResponse<AdminMe>>('/admin/me');
            if (response.data?.data) setMe(response.data.data);
        } catch {
            // Keep the optimistic value — the backend is authoritative, so
            // a failed refresh simply leaves the bootstrap as-is.
        }
    }, []);

    const value_: AdminMeContextValue = { me, refresh };
    return <AdminMeContext.Provider value={value_}>{children}</AdminMeContext.Provider>;
}

export function useAdminMe(): AdminMe | undefined {
    return useContext(AdminMeContext)?.me;
}

export function useRefreshAdminMe(): () => Promise<void> {
    return useContext(AdminMeContext)?.refresh ?? (async () => undefined);
}

/**
 * Shared 403 handling for mutations (spec §5.1 rule 6): a 403 shows the
 * permission toast and refreshes /admin/me once — the role may have
 * changed server-side since the bootstrap.
 */
export function useMutationForbiddenToast(): (error: unknown) => void {
    const t = useTranslations('admin');
    const refresh = useRefreshAdminMe();
    return useCallback(
        (error: unknown) => {
            const apiError = error as ApiError | null;
            if (apiError?.code === 'FORBIDDEN') {
                toast.error(t('pages.forbidden.mutation403Toast'));
                void refresh();
            }
        },
        [refresh, t],
    );
}
