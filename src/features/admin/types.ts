/**
 * Admin Panel feature types (AP-016 — frontend foundation).
 *
 * `AdminMe` mirrors the backend `AdminMeDto` (c0c-bake `admin.dto.ts`) — the
 * role vocabulary is the backend `AdminRole`, and `permissions` is the
 * effective permission set the backend returns for that role (spec §5.1
 * rule 1). Nothing here is authoritative: the backend re-checks every call.
 */
import type { LucideIcon } from 'lucide-react';

export type AdminRole = 'super_admin' | 'finance_manager' | 'admin' | 'support_agent';

/** Effective admin identity from `GET /api/v1/admin/me` (spec §5.1 rule 1). */
export interface AdminMe {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: AdminRole;
    plan: string;
    emailVerified: boolean;
    onboardingCompleted: boolean;
    onboardingStep: number;
    /** Effective permission set for the role (backend `PERMISSIONS` keys). */
    permissions: string[];
    suspendedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type AdminEnvironment = 'production' | 'preview' | 'development';

export interface AdminNavItem {
    /**
     * Data-key fallback; the rendered label comes from the `admin` i18n
     * catalog — same convention as the customer `navigation.json` (AR-029).
     */
    titleKey: string;
    url: string;
    icon: LucideIcon;
    /**
     * Backend `PERMISSIONS` keys that show the item (spec §2.2). An empty
     * list means "always visible"; the sidebar drops items without.
     */
    permissions: string[];
}

export interface AdminNavGroup {
    labelKey: string;
    items: AdminNavItem[];
}
