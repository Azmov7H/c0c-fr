import { serverGet } from '@/lib/server-api';
import { UserDetailPage } from '@/features/admin/components/user-detail-page';
import type { AdminUserDetailDto } from '@/features/admin/services/users.admin.service';

/**
 * User detail (spec §4.2): status badges, summary facts, recent audit rows.
 * Server-fetched (spec §5.1); the backend is authoritative.
 */
export default async function UserDetailRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await serverGet<AdminUserDetailDto>(`/admin/users/${id}`);
    return <UserDetailPage user={user} />;
}
