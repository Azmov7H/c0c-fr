'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User as UserIcon } from 'lucide-react';
import { formatLocaleTag } from '@/lib/format';
import { useUrlLocale } from '@/i18n/locale';
import { toast } from '@/lib/toast';
import { useAdminMe } from '@/features/admin/hooks/use-admin';
import { hasAdminPermission } from '@/features/admin/lib/permissions';
import { useStepUpToken } from '@/features/admin/lib/step-up-context';
import { useMutationForbiddenToast } from '@/features/admin/components/admin-me-provider';
import { usersAdminService } from '@/features/admin/services/users.admin.service';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/features/admin/components/status-badge';
import { Money } from '@/features/admin/components/money';
import type { AdminUserRow } from '@/features/admin/services/users.admin.service';

import { UserDeleteDialog } from './user-delete-dialog';
import { UserRoleDialog } from './user-role-dialog';
import { UserRevokeSessionsDialog } from './user-revoke-sessions-dialog';
import { UserSuspendDialog, UserRestoreDialog } from './user-suspension-dialogs';

/**
 * Users list (spec §4.2): the table — user (name + email), role, plan,
 * subscription, credits, status, created, and row actions: view, revoke
 * sessions, suspend/restore, role, plan, delete — each permission-gated
 * (spec §5.1/§5.2; a missing control is hidden, not disabled).
 */
export function UsersTable({ users }: { users: AdminUserRow[] }) {
    const t = useTranslations('admin');
    const locale = useUrlLocale();
    const me = useAdminMe();
    const stepUpToken = useStepUpToken();
    const mutationForbiddenToast = useMutationForbiddenToast();
    const router = useRouter();
    const [suspendTarget, setSuspendTarget] = useState<AdminUserRow | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<AdminUserRow | null>(null);
    const [revokeTarget, setRevokeTarget] = useState<AdminUserRow | null>(null);
    const [roleTarget, setRoleTarget] = useState<AdminUserRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

    const formatTime = (iso: string): string =>
        new Intl.DateTimeFormat(formatLocaleTag(locale), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(iso));

    // Literal catalog keys (i18n usage gate) — one per column.
    const columnLabels: Record<string, string> = {
        user: t('pages.users.columns.user'),
        role: t('pages.users.columns.role'),
        plan: t('pages.users.columns.plan'),
        subscription: t('pages.users.columns.subscription'),
        credits: t('pages.users.columns.credits'),
        status: t('pages.users.columns.status'),
        created: t('pages.users.columns.created'),
        actions: t('pages.users.columns.actions'),
    };

    const run = async (label: string, run: () => Promise<unknown>) => {
        try {
            await run();
            toast.success(label);
            void router.refresh();
        } catch (error) {
            mutationForbiddenToast(error);
        }
    };

    const canSuspend = me ? hasAdminPermission(me.permissions, 'users.suspend') : false;
    const canRestore = me ? hasAdminPermission(me.permissions, 'users.restore') : false;
    const canRevoke = me ? hasAdminPermission(me.permissions, 'users.sessions.revoke') : false;
    const canRole = me ? hasAdminPermission(me.permissions, 'users.role.write') : false;
    const canDelete = me ? hasAdminPermission(me.permissions, 'users.delete') : false;

    return (
        <section className="space-y-3">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {(['user', 'role', 'plan', 'subscription', 'credits', 'status', 'created', 'actions'] as const).map(
                            (key) => (
                                <th key={key} className="py-2 pe-3">{columnLabels[key]}</th>
                            ),
                        )}
                    </tr>
                </thead>
                <tbody>
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                {t('pages.users.list.noUsers')}
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-accent/40">
                                <td className="py-2 pe-3">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <span className="block truncate font-medium">
                                                {`${user.firstName} ${user.lastName}`.trim() || user.email}
                                            </span>
                                            <span className="block truncate font-mono text-xs text-muted-foreground">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2 pe-3">
                                    <StatusBadge status={user.role} label={user.role} />
                                </td>
                                <td className="py-2 pe-3">
                                    <span className="capitalize">{user.plan}</span>
                                </td>
                                <td className="py-2 pe-3">
                                    <StatusBadge status={user.subscription.status} />
                                </td>
                                <td className="py-2 pe-3">
                                    {user.credits ? (
                                        <Money value={user.credits.balance} />
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </td>
                                <td className="py-2 pe-3">
                                    <div className="flex gap-1">
                                        <StatusBadge status={user.suspended ? 'suspended' : 'active'} />
                                        {!user.emailVerified ? (
                                            <StatusBadge status="pending" label={t('pages.users.columns.unverified')} />
                                        ) : null}
                                    </div>
                                </td>
                                <td className="py-2 pe-3">{formatTime(user.createdAt)}</td>
                                <td className="py-2">
                                    <div className="flex flex-wrap items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => void router.push(`/admin/users/${user.id}`)}
                                        >
                                            {t('pages.users.actions.view')}
                                        </Button>
                                        {canSuspend && !user.suspended ? (
                                            <Button variant="ghost" size="sm" onClick={() => setSuspendTarget(user)}>
                                                {t('pages.users.actions.suspend')}
                                            </Button>
                                        ) : null}
                                        {canRestore && user.suspended ? (
                                            <Button variant="ghost" size="sm" onClick={() => setRestoreTarget(user)}>
                                                {t('pages.users.actions.restore')}
                                            </Button>
                                        ) : null}
                                        {canRevoke ? (
                                            <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(user)}>
                                                {t('pages.users.actions.revokeSessions')}
                                            </Button>
                                        ) : null}
                                        {canRole ? (
                                            <Button variant="ghost" size="sm" onClick={() => setRoleTarget(user)}>
                                                {t('pages.users.actions.changeRole')}
                                            </Button>
                                        ) : null}
                                        {canDelete ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => setDeleteTarget(user)}
                                            >
                                                {t('pages.users.actions.delete')}
                                            </Button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {suspendTarget ? (
                <UserSuspendDialog
                    open
                    onClose={() => setSuspendTarget(null)}
                    user={suspendTarget}
                    onSuspend={(body) => run(t('pages.users.dialogs.suspend.success'), () => usersAdminService.suspend(suspendTarget.id, body, stepUpToken))}
                />
            ) : null}
            {restoreTarget ? (
                <UserRestoreDialog
                    open
                    onClose={() => setRestoreTarget(null)}
                    user={restoreTarget}
                    onRestore={(body) => run(t('pages.users.dialogs.restore.success'), () => usersAdminService.restore(restoreTarget.id, body, stepUpToken))}
                />
            ) : null}
            {revokeTarget ? (
                <UserRevokeSessionsDialog
                    open
                    onClose={() => setRevokeTarget(null)}
                    user={revokeTarget}
                    onRevoke={() => run(t('pages.users.dialogs.revokeSessions.success'), () => usersAdminService.revokeSessions(revokeTarget.id, stepUpToken))}
                />
            ) : null}
            {roleTarget ? (
                <UserRoleDialog
                    open
                    onClose={() => setRoleTarget(null)}
                    user={roleTarget}
                    onChangeRole={(body) => run(t('pages.users.dialogs.role.success'), () => usersAdminService.changeRole(roleTarget.id, body, stepUpToken))}
                />
            ) : null}
            {deleteTarget ? (
                <UserDeleteDialog
                    open
                    onClose={() => setDeleteTarget(null)}
                    user={deleteTarget}
                    onDelete={() => run(t('pages.users.dialogs.delete.success'), () => usersAdminService.delete(deleteTarget.id, stepUpToken))}
                />
            ) : null}
        </section>
    );
}
