/**
 * Admin sidebar navigation (spec §2.2).
 *
 * Groups and items mirror the spec:
 * - Overview → `overview.read`
 * - Customers → Users, Subscriptions, Credits, Payments (`.read` each)
 * - AI → AI Operations, AI Providers (`ai.operations.read` / `ai.providers.read`)
 * - Content → Projects (`projects.read`)
 * - Platform → System Health, Audit Logs (`health.read` / `audit.read`)
 * - Admin → Settings, Roles & Permissions (`settings.read` / `permissions.read`)
 *
 * A group with no visible item is hidden entirely (spec §2.2 rule: "A group
 * with no visible item is hidden entirely").
 */
import {
    Activity,
    Bot,
    CreditCard,
    DollarSign,
    FolderKanban,
    LayoutDashboard,
    ScrollText,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';

import type { AdminNavGroup } from '../types';

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
    {
        labelKey: 'groups.overview',
        items: [
            {
                titleKey: 'items.overview',
                url: '/admin',
                icon: LayoutDashboard,
                permissions: ['overview.read'],
            },
        ],
    },
    {
        labelKey: 'groups.customers',
        items: [
            {
                titleKey: 'items.users',
                url: '/admin/users',
                icon: Users,
                permissions: ['users.read'],
            },
            {
                titleKey: 'items.subscriptions',
                url: '/admin/subscriptions',
                icon: CreditCard,
                permissions: ['subscriptions.read'],
            },
            {
                titleKey: 'items.credits',
                url: '/admin/credits',
                icon: DollarSign,
                permissions: ['credits.read'],
            },
            {
                titleKey: 'items.payments',
                url: '/admin/payments',
                icon: DollarSign,
                permissions: ['payments.read'],
            },
        ],
    },
    {
        labelKey: 'groups.ai',
        items: [
            {
                titleKey: 'items.aiOperations',
                url: '/admin/ai-operations',
                icon: Bot,
                permissions: ['ai.operations.read'],
            },
            {
                titleKey: 'items.aiProviders',
                url: '/admin/providers',
                icon: ShieldCheck,
                permissions: ['ai.providers.read'],
            },
        ],
    },
    {
        labelKey: 'groups.content',
        items: [
            {
                titleKey: 'items.projects',
                url: '/admin/projects',
                icon: FolderKanban,
                permissions: ['projects.read'],
            },
        ],
    },
    {
        labelKey: 'groups.platform',
        items: [
            {
                titleKey: 'items.systemHealth',
                url: '/admin/system-health',
                icon: Activity,
                permissions: ['health.read'],
            },
            {
                titleKey: 'items.auditLogs',
                url: '/admin/audit-logs',
                icon: ScrollText,
                permissions: ['audit.read'],
            },
        ],
    },
    {
        labelKey: 'groups.admin',
        items: [
            {
                titleKey: 'items.settings',
                url: '/admin/settings',
                icon: Settings,
                permissions: ['settings.read'],
            },
            {
                titleKey: 'items.rolesPermissions',
                url: '/admin/settings/roles',
                icon: ShieldCheck,
                permissions: ['permissions.read'],
            },
        ],
    },
];

/** Every visible nav URL — used for "active" matching and dead-route audits. */
export function getAdminNavUrls(): string[] {
    return ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.url));
}
