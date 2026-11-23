import { AdminShell } from '@/features/admin/components/admin-shell';

/**
 * `(admin)` route group layout — every admin route (`/admin`, `/admin/users`,
 * …) renders inside the admin shell: sidebar + header + content
 * (UI-UX-SPEC §2). The authoritative gate is `GET /api/v1/admin/me` on the
 * backend; this shell renders chrome only.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <AdminShell>{children}</AdminShell>;
}
