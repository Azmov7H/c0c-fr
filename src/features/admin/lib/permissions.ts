/**
 * Admin Panel permission vocabulary (spec §5.1, §2.2).
 *
 * This mirrors the backend `PERMISSIONS` map (c0c-bake `admin.permissions.ts`)
 * — "never client-invented" cuts both ways: the strings ARE the contract, so
 * every key a UI file references here is also defined in the backend. The
 * authoritative check is server-side (`roleHasPermission`); this list is for
 * nav filtering, `PermissionGate` and read-only UX.
 */

export const ADMIN_PERMISSIONS = {
    // Overview
    'overview.read': 'overview.read',
    'overview.financial.read': 'overview.financial.read',
    // Users
    'users.read': 'users.read',
    'users.billing.read': 'users.billing.read',
    'users.security.read': 'users.security.read',
    'users.suspend': 'users.suspend',
    'users.restore': 'users.restore',
    'users.sessions.revoke': 'users.sessions.revoke',
    'users.role.write': 'users.role.write',
    'users.plan.write': 'users.plan.write',
    'users.delete': 'users.delete',
    // Subscriptions
    'subscriptions.read': 'subscriptions.read',
    'subscriptions.write': 'subscriptions.write',
    // Credits
    'credits.read': 'credits.read',
    'credits.grant': 'credits.grant',
    'credits.refund': 'credits.refund',
    'credits.reconcile': 'credits.reconcile',
    // AI
    'ai.operations.read': 'ai.operations.read',
    'ai.operations.cancel': 'ai.operations.cancel',
    'ai.providers.read': 'ai.providers.read',
    'ai.providers.test': 'ai.providers.test',
    // Projects
    'projects.read': 'projects.read',
    'projects.moderate': 'projects.moderate',
    // Payments
    'payments.read': 'payments.read',
    'payments.sync': 'payments.sync',
    'payments.refund': 'payments.refund',
    'payments.note': 'payments.note',
    // Platform
    'health.read': 'health.read',
    'audit.read': 'audit.read',
    'audit.financial.read': 'audit.financial.read',
    'audit.export': 'audit.export',
    // Settings
    'settings.read': 'settings.read',
    'settings.write': 'settings.write',
    'permissions.read': 'permissions.read',
} as const;

export type AdminPermission = keyof typeof ADMIN_PERMISSIONS;

/**
 * `hasAdminPermission` — the UX check, not the enforcement point.
 * Spec §5.1 rule 1: `GET /admin/me` returns `permissions: string[]`.
 */
export function hasAdminPermission(
    permissions: readonly string[],
    permission: string,
): boolean {
    return permissions.includes(permission);
}

/**
 * Role → catalog-key (namespace `admin`) for the account badge (spec §2.3).
 * The label strings live in `messages/<locale>/admin.json` → `shell.role.*`.
 */
export function adminRoleLabelKey(role: string): string {
    switch (role) {
        case 'super_admin':
            return 'shell.role.superAdmin';
        case 'finance_manager':
            return 'shell.role.financeManager';
        case 'admin':
            return 'shell.role.admin';
        case 'support_agent':
            return 'shell.role.supportAgent';
        default:
            return 'shell.role.default';
    }
}
