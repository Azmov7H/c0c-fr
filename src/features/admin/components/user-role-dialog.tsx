'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { ADMIN_ROLES, adminRoleLabelKey } from '@/features/admin/lib/permissions';
import type { AdminRole } from '@/features/admin/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DangerConfirmDialog } from './danger-confirm-dialog';
import { AdminActionDialog } from './admin-action-dialog';
import { ReasonField } from './reason-field';
import type { AdminUserRow } from '@/features/admin/services/users.admin.service';

export function UserRoleDialog({
    open,
    onClose,
    user,
    onChangeRole,
}: {
    open: boolean;
    onClose: () => void;
    user: AdminUserRow;
    onChangeRole: (body: { role: AdminRole; reason?: string }) => void;
}) {
    const t = useTranslations('admin');
    const [newRole, setNewRole] = useState<AdminRole>('admin');
    const [reason, setReason] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
    const needsConfirm = newRole !== user.role;

    const submitRole = () => {
        if (needsConfirm) {
            setConfirmOpen(true);
            return;
        }
        onChangeRole({ role: newRole, reason: reason.trim() || undefined });
        onClose();
    };

    return (
        <>
            <AdminActionDialog
                open={open}
                onOpenChange={onClose}
                title={t('pages.users.dialogs.role.title')}
                description={t('pages.users.dialogs.role.description', { user: displayName, role: t(adminRoleLabelKey(newRole)) })}
                consequence={t('pages.users.dialogs.role.consequence')}
                submitLabel={t('pages.users.dialogs.role.confirm')}
                onSubmit={submitRole}
                requiresStepUp
            >
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {ADMIN_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                                {t(adminRoleLabelKey(role))}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <ReasonField value={reason} onChange={setReason} label={t('pages.users.dialogs.role.reasonLabel')} />
            </AdminActionDialog>
            <DangerConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={t('pages.users.dialogs.role.title')}
                description={t('pages.users.dialogs.role.description', { user: displayName, role: t(adminRoleLabelKey(newRole)) })}
                target={user.email}
                confirmLabel={t('pages.users.dialogs.role.confirm')}
                onConfirm={() => {
                    onChangeRole({ role: newRole, reason: reason.trim() || undefined });
                    setConfirmOpen(false);
                    onClose();
                }}
            />
        </>
    );
}
