import { serverGet } from '@/lib/server-api';
import { getTranslations } from '@/i18n/server';
import { PageHeader } from '@/components/shared/page-header';
import { UsersFilterBar } from '@/features/admin/components/users-filter-bar';
import { UsersTable } from '@/features/admin/components/users-table';
import type { AdminUserRow } from '@/features/admin/services/users.admin.service';

async function fetchSafe<T>(path: string, params?: object): Promise<T | undefined> {
    try {
        return await serverGet<T>(path, params);
    } catch {
        return undefined;
    }
}

/**
 * Users list (spec §4.2): filters, columns, row actions. Server-fetched
 * (spec §5.1 — the backend re-checks); the table is client (dialogs,
 * router). Each fetch is isolated so a missing permission renders the
 * section absent (spec §5.2).
 */
export default async function UsersListPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
    const { q, role, page } = await searchParams;
    const users = await fetchSafe<AdminUserRow[]>('/admin/users', {
        q: q ?? '',
        role: role ?? '',
        page: Number(page ?? 1),
        limit: 50,
    });
    const t = await getTranslations('admin');
    return (
        <div className="space-y-4">
            <PageHeader title={t('pages.users.title')} />
            <UsersFilterBar />
            <UsersTable users={users ?? []} />
        </div>
    );
}
