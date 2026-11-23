import { serverGet } from '@/lib/server-api';
import { isAdminRole } from '@/features/admin/lib/permissions';
import { AdminForbiddenPage } from '@/features/admin/components/admin-forbidden-page';
import { AdminMeProvider } from '@/features/admin/components/admin-me-provider';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { StepUpProvider } from '@/features/admin/lib/step-up-context';
import type { AdminMe } from '@/features/admin/types';

/**
 * `(admin)` route group layout — every admin route (`/admin`,
 * `/admin/users`, …) renders inside the admin shell: sidebar + header +
 * content (UI-UX-SPEC §2). The backend is authoritative:
 * `GET /api/v1/admin/me` decides whether the viewer may use the admin panel
 * at all (spec §2.4, §5.2) — a non-admin gets the neutral 403 page, and the
 * shell renders chrome only.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    let me: AdminMe | undefined;
    try {
        me = await serverGet<AdminMe>('/admin/me');
    } catch {
        // Not an admin / not signed in — the backend is the authority here.
        me = undefined;
    }
    if (!me || !isAdminRole(me.role)) {
        return <AdminForbiddenPage />;
    }
    return (
        <StepUpProvider>
            <AdminMeProvider value={me}>
                <AdminShell>{children}</AdminShell>
            </AdminMeProvider>
        </StepUpProvider>
    );
}
