'use client';

import { useUrlLocale } from '@/i18n/locale';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
    Check,
    Clock,
    Copy,
    Loader2,
    MailPlus,
    ShieldAlert,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { toast } from '@/lib/toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UpgradePrompt } from '@/features/billing/components/upgrade-prompt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth-store';
import { toApiError } from '@/lib/api-error';

import {
    useCreateInvite,
    useProjectInvites,
    useProjectMembers,
    useRemoveMember,
    useRevokeInvite,
    useUpdateMemberRole,
} from '../../hooks/use-collaboration';
import { can, grantableRoles } from '../../lib/permissions';
import { roleDescription, roleLabel } from '../../lib/projects-labels';
import {
    expiryLabel,
    inviteStateLabel,
    workspaceRelativeTime,
} from '../../lib/workspace-labels';
import type {
    CreateInviteResponse,
    ProjectMember,
    ProjectMemberRole,
    ProjectRole,
} from '../../types';

type InviteValues = { email: string; role: ProjectMemberRole };

const ROLE_STYLE: Record<ProjectRole, string> = {
    owner: 'bg-primary/10 text-primary border-primary/20',
    editor: 'bg-info/10 text-info border-info/20',
    commenter: 'bg-brand-violet/10 text-brand-violet border-brand-violet/20',
    viewer: 'bg-muted text-muted-foreground border-border',
};

const initials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

export function MembersTab({ projectId, role }: { projectId: string; role: ProjectRole }) {
    const locale = useUrlLocale();
    const t = useTranslations('workspace');
    const tp = useTranslations('projects');
    const currentUserId = useAuthStore((state) => state.user?.id ?? '');
    const { data, isLoading, error, refetch } = useProjectMembers(projectId);
    const invitesQuery = useProjectInvites(projectId);
    const updateRole = useUpdateMemberRole(projectId);
    const removeMember = useRemoveMember(projectId);
    const createInvite = useCreateInvite(projectId);
    const revokeInvite = useRevokeInvite(projectId);

    const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);
    const [createdInvite, setCreatedInvite] = useState<CreateInviteResponse | null>(null);

    // The validation message is catalog copy, so the schema is built where the
    // translator lives; `useMemo` keeps the resolver identity stable per locale.
    const inviteSchema = useMemo(
        () =>
            z.object({
                email: z.string().trim().email(t('members.validationEmail')).max(254),
                role: z.enum(['editor', 'commenter', 'viewer']),
            }),
        [t]
    );

    const form = useForm<InviteValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { email: '', role: 'editor' },
        mode: 'onChange',
    });
    const email = useWatch({ control: form.control, name: 'email' });
    const inviteRole = useWatch({ control: form.control, name: 'role' });

    const mayManage = can(role, 'manage');
    const roles = grantableRoles(role);
    const atLimit = data ? data.usedSlots >= data.memberLimit : false;

    const roster = useMemo(() => {
        if (!data) return [];
        return [
            ...(data.owner.user
                ? [{
                      userId: data.owner.userId,
                      role: 'owner' as const,
                      joinedAt: '',
                      user: data.owner.user,
                  }]
                : []),
            ...data.members,
        ];
    }, [data]);

    const submitInvite = form.handleSubmit((values) => {
        createInvite.mutate(values, {
            onSuccess: (invite) => {
                setCreatedInvite(invite);
                form.reset({ email: '', role: values.role });
            },
        });
    });

    const copyUrl = async () => {
        if (!createdInvite) return;
        try {
            await navigator.clipboard.writeText(createdInvite.acceptUrl);
            toast.success(t('members.linkCopied'));
        } catch {
            toast.error(t('members.linkCopyFailed'));
        }
    };

    if (isLoading) {
        return <p className="text-sm text-muted-foreground" role="status">{t('members.loading')}</p>;
    }
    if (error || !data) {
        return (
            <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>{t('members.loadErrorTitle')}</AlertTitle>
                <AlertDescription className="flex items-center gap-3">
                    {toApiError(error, t('members.loadErrorFallback')).message}
                    <Button variant="outline" className="h-11" onClick={() => refetch()}>{t('members.retry')}</Button>
                </AlertDescription>
            </Alert>
        );
    }

    const expiredInvites = (invitesQuery.data ?? []).filter((invite) => invite.state !== 'pending');

    return (
        /**
         * T20: the app-level TooltipProvider was removed from app-providers.tsx
         * (it pulled Popper into every authenticated route's first-load graph,
         * and this tab is the only Tooltip consumer in the tree). This is the
         * feature-local home its comment promised; without it Radix's Root
         * throws "`Tooltip` must be used within `TooltipProvider`" the moment
         * a member row renders — E2E journey-2/3 caught exactly that.
         */
        <TooltipProvider>
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="size-5" aria-hidden="true" />
                            {t('members.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('members.collaborators', {
                                used: data.usedSlots,
                                limit: data.memberLimit,
                            })}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y divide-border/60" aria-label={t('members.listAria')}>
                        {roster.map((member) => {
                            const isOwner = member.role === 'owner';
                            const displayRole = member.role as ProjectRole;
                            const name = member.user
                                ? [member.user.firstName, member.user.lastName].filter(Boolean).join(' ') || member.user.email
                                : t('members.deletedAccount');
                            const joined = 'joinedAt' in member && member.joinedAt
                                ? t('members.joined', {
                                      time: workspaceRelativeTime(t, member.joinedAt, locale),
                                  })
                                : t('members.owner');
                            return (
                                <li key={member.userId} className="flex flex-wrap items-center gap-3 py-4">
                                    <Avatar className="size-10">
                                        {member.user?.avatar && (
                                            <AvatarImage src={member.user.avatar} alt="" />
                                        )}
                                        <AvatarFallback><bdi>{initials(member.user?.firstName, member.user?.lastName)}</bdi></AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap items-center gap-2 font-medium">
                                            <span className="truncate"><bdi>{name}</bdi></span>
                                            {member.userId === currentUserId && (
                                                <span className="text-xs text-muted-foreground">{t('members.you')}</span>
                                            )}
                                            <Badge variant="outline" className={ROLE_STYLE[displayRole]}>
                                                {roleLabel(tp, displayRole)}
                                            </Badge>
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            <bdi>{member.user?.email ?? t('members.accountUnavailable')}</bdi> · {joined}
                                        </p>
                                    </div>

                                    {isOwner ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0} className="cursor-not-allowed" title={t('members.ownerRemoveTooltip')}>
                                                    <Button variant="ghost" size="icon" className="size-11" disabled aria-label={t('members.ownerRemoveAria')}>
                                                        <Trash2 className="size-4" aria-hidden="true" />
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('members.ownerRemoveTooltip')}</TooltipContent>
                                        </Tooltip>
                                    ) : mayManage ? (
                                        <div className="flex items-center gap-1">
                                            <Select
                                                value={member.role}
                                                onValueChange={(value) =>
                                                    updateRole.mutate({
                                                        userId: member.userId,
                                                        role: value as ProjectMemberRole,
                                                    })
                                                }
                                                disabled={updateRole.isPending}
                                            >
                                                <SelectTrigger className="h-11 w-36" aria-label={t('members.roleAria', { name })}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {roleLabel(tp, option)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-11 text-destructive"
                                                aria-label={t('members.removeAria', { name })}
                                                onClick={() => setRemoveTarget(member)}
                                            >
                                                <Trash2 className="size-4" aria-hidden="true" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0} className="cursor-not-allowed" title={t('members.nonOwnerRemoveTooltip')}>
                                                    <Button variant="ghost" size="icon" className="size-11" disabled aria-label={t('members.nonOwnerRemoveAria', { name })}>
                                                        <Trash2 className="size-4" aria-hidden="true" />
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('members.nonOwnerRemoveTooltip')}</TooltipContent>
                                        </Tooltip>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MailPlus className="size-5" aria-hidden="true" />
                        {t('members.inviteTitle')}
                    </CardTitle>
                    <CardDescription>
                        {t('members.inviteDescription', { email: email ? `${email} ` : '' })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {atLimit && (
                        <UpgradePrompt
                            title={t('members.limitTitle')}
                            description={t('members.limitDescription', {
                                used: data.usedSlots,
                                limit: data.memberLimit,
                            })}
                            ctaLabel={t('members.limitCta')}
                            feature="project.members"
                            used={data.usedSlots}
                            limit={data.memberLimit}
                        />
                    )}
                    {!mayManage && (
                        <p className="text-sm text-muted-foreground">
                            {t('members.onlyOwnerInvite')}
                        </p>
                    )}

                    <Form {...form}>
                        <form onSubmit={submitInvite} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>{t('members.emailLabel')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                autoComplete="email"
                                                placeholder={t('members.emailPlaceholder')}
                                                className="h-11"
                                                disabled={!mayManage || atLimit}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="sm:w-40">
                                        <FormLabel>{t('members.roleLabel')}</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={!mayManage || atLimit}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11" aria-label={t('members.inviteRoleAria')}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roles.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {roleLabel(tp, option)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="mt-0 h-11 sm:mt-8"
                                disabled={!mayManage || atLimit || !email || createInvite.isPending}
                            >
                                {createInvite.isPending ? (
                                    <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                                ) : null}
                                {t('members.createInvite')}
                            </Button>
                        </form>
                    </Form>
                    <p className="text-xs text-muted-foreground">
                        {roleDescription(tp, inviteRole)}
                    </p>
                    {!mayManage && (
                        <p className="text-xs text-muted-foreground">
                            {t('members.inviteDisabledNote')}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="size-5" aria-hidden="true" />
                        {t('members.pendingTitle')}
                    </CardTitle>
                    <CardDescription>{t('members.pendingDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {expiredInvites.length > 0 && (
                        <Alert className="mb-4">
                            <Clock />
                            <AlertTitle>{t('members.invalidTitle')}</AlertTitle>
                            <AlertDescription className="flex items-center justify-between gap-3">
                                {t('members.invalidDescription')}
                                <Button variant="outline" className="h-11" onClick={() => invitesQuery.refetch()}>
                                    {t('members.refresh')}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    {invitesQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground" role="status">{t('members.pendingLoading')}</p>
                    ) : (invitesQuery.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('members.pendingEmpty')}</p>
                    ) : (
                        <ul className="divide-y divide-border/60" aria-label={t('members.pendingAria')}>
                            {(invitesQuery.data ?? []).map((invite) => (
                                <li key={invite.id} className="flex flex-wrap items-center gap-3 py-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium"><bdi>{invite.email}</bdi></p>
                                        <p className="text-xs text-muted-foreground">
                                            {roleLabel(tp, invite.role)} · {t('members.invitedByOwner')} · {expiryLabel(t, invite.expiresAt)}
                                            {invite.state !== 'pending' ? ` · ${inviteStateLabel(t, invite.state)}` : ''}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-11"
                                        disabled={!mayManage || revokeInvite.isPending || invite.state === 'accepted' || invite.state === 'revoked'}
                                        onClick={() => revokeInvite.mutate(invite.id)}
                                    >
                                        <X className="me-2 size-4" aria-hidden="true" />
                                        {t('members.revoke')}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('members.removeTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('members.removeDescription', {
                                name: removeTarget?.user?.email ?? t('members.removeUnknown'),
                            })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" className="h-11" onClick={() => setRemoveTarget(null)}>
                            {t('members.keepMember')}
                        </Button>
                        <Button
                            variant="destructive"
                            className="h-11"
                            disabled={removeMember.isPending}
                            onClick={() => {
                                if (!removeTarget) return;
                                removeMember.mutate(removeTarget.userId, {
                                    onSettled: () => setRemoveTarget(null),
                                });
                            }}
                        >
                            {removeMember.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
                            {t('members.removeMember')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!createdInvite} onOpenChange={(open) => !open && setCreatedInvite(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('members.inviteReadyTitle', { email: createdInvite?.email ?? '' })}</DialogTitle>
                        <DialogDescription>
                            {t('members.inviteReadyDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2">
                        <Input readOnly dir="ltr" value={createdInvite?.acceptUrl ?? ''} aria-label={t('members.inviteLinkAria')} className="h-11 font-mono text-xs" />
                        <Button type="button" className="h-11" onClick={copyUrl}>
                            <Copy className="me-2 size-4" aria-hidden="true" />
                            {t('members.copy')}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('members.inviteExpiry', {
                            expiry: createdInvite ? expiryLabel(t, createdInvite.expiresAt) : '',
                        })}
                    </p>
                    <DialogFooter>
                        <Button variant="outline" className="h-11" onClick={() => setCreatedInvite(null)}>
                            <Check className="me-2 size-4" aria-hidden="true" />
                            {t('members.done')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </TooltipProvider>
    );
}
