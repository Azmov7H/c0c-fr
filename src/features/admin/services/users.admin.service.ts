import type { AdminRole } from '@/features/admin/types';
import type { UserPlan } from '@/types';

/**
 * Admin Users API client (AP-024, spec §4.2, §2.4 route map): `/admin/users`,
 * `/admin/users/:id` (AP-022) + the user mutations (AP-023):
 * `POST /users/:id/suspend`, `/restore`, `/revoke-sessions`, `PATCH /role`,
 * `/plan`, `DELETE /users/:id` (c0c-bake `admin.routes.ts` on `main`).
 *
 * Same-origin, same-session (ARCHITECTURE.md: "Same origin, same cookies").
 * The body is the unwrapped `{success, data}` envelope — each helper returns
 * `body.data`. The `X-Admin-Step-Up` header rides along when the caller holds
 * a fresh step-up token (memory-only — spec §5.1 rule 5).
 */

export interface AdminUserRow {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    plan: string;
    emailVerified: boolean;
    onboardingCompleted: boolean;
    suspended: boolean;
    createdAt: string;
    lastSeenAt: string | null;
    subscription: { status: string; currentPeriodEnd: string | null };
    credits: { balance: number; held: number } | null;
}

export interface AdminUserAuditRow {
    action: string;
    actor: { id: string; email: string; role: string } | null;
    targetId: string | null;
    reason: string | null;
    createdAt: string;
}

export interface AdminUserDetailDto extends AdminUserRow {
    auditRows: AdminUserAuditRow[];
    projectCount: number;
}

export interface UsersPageMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface UsersPage {
    data: AdminUserRow[];
    meta: UsersPageMeta;
}

async function adminApiRequest<T>(
    path: string,
    init: RequestInit = {},
    stepUpToken?: string | null,
): Promise<T> {
    const response = await fetch(`/api/v1${path}`, {
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...(stepUpToken ? { 'X-Admin-Step-Up': stepUpToken } : {}),
        },
        ...init,
    });
    const body = (await response.json().catch(() => null)) as
        | { data: T; error?: { code: string; message: string } }
        | null;
    if (!response.ok) {
        const error = Object.assign(
            new Error(body?.error?.message ?? `Request failed (${response.status})`),
            { code: body?.error?.code, status: response.status },
        );
        throw error;
    }
    return (body?.data ?? (null as unknown as T));
}

export const usersAdminService = {
    /** `GET /admin/users` — spec §4.2 filters: q, role, plan, suspended, … */
    async list(query: Record<string, string | number | undefined>): Promise<UsersPage> {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== '') params.set(key, String(value));
        }
        const suffix = params.toString() ? `?${params.toString()}` : '';
        return adminApiRequest<UsersPage>(`/admin/users${suffix}`);
    },

    /** `GET /admin/users/:id` — spec §4.2 detail. */
    async detail(userId: string): Promise<AdminUserDetailDto> {
        return adminApiRequest<AdminUserDetailDto>(`/admin/users/${userId}`);
    },

    /** `POST /admin/users/:id/suspend` (AP-023). */
    async suspend(userId: string, body: { reason?: string }, token?: string | null): Promise<void> {
        await adminApiRequest(`/admin/users/${userId}/suspend`, { method: 'POST', body: JSON.stringify(body) }, token);
    },

    /** `POST /admin/users/:id/restore` (AP-023). */
    async restore(userId: string, body: { reason?: string }, token?: string | null): Promise<void> {
        await adminApiRequest(`/admin/users/${userId}/restore`, { method: 'POST', body: JSON.stringify(body) }, token);
    },

    /** `POST /admin/users/:id/revoke-sessions` (AP-023). */
    async revokeSessions(userId: string, token?: string | null): Promise<void> {
        await adminApiRequest(`/admin/users/${userId}/revoke-sessions`, { method: 'POST' }, token);
    },

    /** `PATCH /admin/users/:id/role` (AP-023; `users.role.write`). */
    async changeRole(
        userId: string,
        body: { role: AdminRole | string; reason?: string },
        token?: string | null,
    ): Promise<void> {
        await adminApiRequest(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify(body) }, token);
    },

    /** `PATCH /admin/users/:id/plan` (AP-023; `users.plan.write`). */
    async changePlan(
        userId: string,
        body: { plan: UserPlan; reason?: string },
        token?: string | null,
    ): Promise<void> {
        await adminApiRequest(`/admin/users/${userId}/plan`, { method: 'PATCH', body: JSON.stringify(body) }, token);
    },

    /** `DELETE /admin/users/:id` (AP-023; `users.delete`; type-to-confirm). */
    async delete(userId: string, token?: string | null): Promise<void> {
        await adminApiRequest(`/admin/users/${userId}`, { method: 'DELETE' }, token);
    },
};
