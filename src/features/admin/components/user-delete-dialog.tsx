'use client';

import { useTranslations } from 'next-intl';

import { DangerConfirmDialog } from './danger-confirm-dialog';
import type { AdminUserRow } from '@/features/admin/services/users.admin.service';

export function UserDeleteDialog({
    open,
    onClose,
    user,
    onDelete,
}: {
    open: boolean;
    onClose: () => void;
    user: AdminUserRow;
    onDelete: () => void;
}) {
    const t = useTranslations('admin');
    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
    return (
        <DangerConfirmDialog
            open={open}
            onOpenChange={onClose}
            title={t('pages.users.dialogs.delete.title')}
            description={t('pages.users.dialogs.delete.description', { user: displayName })}
            consequence={t('pages.users.dialogs.delete.consequence')}
            target={user.email}
            confirmLabel={t('pages.users.dialogs.delete.confirm')}
            onConfirm={() => {
                onDelete();
                onClose();
            }}
        />
    );
}
