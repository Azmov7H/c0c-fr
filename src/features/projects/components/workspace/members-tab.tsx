'use client';

import { useMemo, useState } from 'react';
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
import { formatRelativeTime } from '@/lib/relative-time';

import {
    useCreateInvite,
    useProjectInvites,
    useProjectMembers,
    useRemoveMember,
    useRevokeInvite,
    useUpdateMemberRole,
} from '../../hooks/use-collaboration';
import { can, grantableRoles, ROLE_DESCRIPTION, ROLE_LABEL } from '../../lib/permissions';
import type {
    CreateInviteResponse,
    ProjectMember,
    ProjectMemberRole,
    ProjectRole,
} from '../../types';

const inviteSchema = z.object({
    email: z.string().trim().email('Enter a valid email address').max(254),
    role: z.enum(['editor', 'commenter', 'viewer']),
});

type InviteValues = z.infer<typeof inviteSchema>;

const ROLE_STYLE: Record<ProjectRole, string> = {
    owner: 'bg-primary/10 text-primary border-primary/20',
    editor: 'bg-info/10 text-info border-info/20',
    commenter: 'bg-brand-violet/10 text-brand-violet border-brand-violet/20',
    viewer: 'bg-muted text-muted-foreground border-border',
};

const initials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

const expiresIn = (iso: string): string => {
    const ms = new Date(iso).getTime() - Date.now();
    if (Number.isNaN(ms) || ms <= 0) return 'expired';
    const hours = Math.floor(ms / 3_600_000);
    if (hours >= 48) return `expires in ${Math.floor(hours / 24)} days`;
    if (hours >= 1) return `expires in ${hours} hour${hours === 1 ? '' : 's'}`;
    const minutes = Math.max(1, Math.floor(ms / 60_000));
    return `expires in ${minutes} minute${minutes === 1 ? '' : 's'}`;
};

export function MembersTab({ projectId, role }: { projectId: string; role: ProjectRole }) {
    const currentUserId = useAuthStore((state) => state.user?.id ?? '');
    const { data, isLoading, error, refetch } = useProjectMembers(projectId);
    const invitesQuery = useProjectInvites(projectId);
    const updateRole = useUpdateMemberRole(projectId);
    const removeMember = useRemoveMember(projectId);
    const createInvite = useCreateInvite(projectId);
    const revokeInvite = useRevokeInvite(projectId);

    const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);
    const [createdInvite, setCreatedInvite] = useState<CreateInviteResponse | null>(null);

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
            toast.success('Invite link copied.');
        } catch {
            toast.error('Could not copy automatically. Select the link and copy it manually.');
        }
    };

    if (isLoading) {
        return <p className="text-sm text-muted-foreground" role="status">Loading members…</p>;
    }
    if (error || !data) {
        return (
            <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>Could not load members</AlertTitle>
                <AlertDescription className="flex items-center gap-3">
                    {toApiError(error, 'Try again in a moment.').message}
                    <Button variant="outline" className="h-11" onClick={() => refetch()}>Retry</Button>
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
                            Members
                        </CardTitle>
                        <CardDescription>
                            {data.usedSlots} of {data.memberLimit} collaborator
                            {data.memberLimit === 1 ? '' : 's'} invited on this project.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y divide-border/60" aria-label="Project members">
                        {roster.map((member) => {
                            const isOwner = member.role === 'owner';
                            const displayRole = member.role as ProjectRole;
                            const name = member.user
                                ? [member.user.firstName, member.user.lastName].filter(Boolean).join(' ') || member.user.email
                                : 'Deleted account';
                            const joined = 'joinedAt' in member && member.joinedAt
                                ? `Joined ${formatRelativeTime(member.joinedAt).relative}`
                                : 'Project owner';
                            return (
                                <li key={member.userId} className="flex flex-wrap items-center gap-3 py-4">
                                    <Avatar className="size-10">
                                        {member.user?.avatar && (
                                            <AvatarImage src={member.user.avatar} alt="" />
                                        )}
                                        <AvatarFallback>{initials(member.user?.firstName, member.user?.lastName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap items-center gap-2 font-medium">
                                            <span className="truncate">{name}</span>
                                            {member.userId === currentUserId && (
                                                <span className="text-xs text-muted-foreground">(you)</span>
                                            )}
                                            <Badge variant="outline" className={ROLE_STYLE[displayRole]}>
                                                {ROLE_LABEL[displayRole]}
                                            </Badge>
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {member.user?.email ?? 'Account no longer available'} · {joined}
                                        </p>
                                    </div>

                                    {isOwner ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0} className="cursor-not-allowed" title="Only the project owner can remove members, and the owner cannot be removed.">
                                                    <Button variant="ghost" size="icon" className="size-11" disabled aria-label="Owner cannot be removed">
                                                        <Trash2 className="size-4" aria-hidden="true" />
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>Only the project owner can remove members, and the owner cannot be removed.</TooltipContent>
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
                                                <SelectTrigger className="h-11 w-36" aria-label={`Role for ${name}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {ROLE_LABEL[option]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-11 text-destructive"
                                                aria-label={`Remove ${name}`}
                                                onClick={() => setRemoveTarget(member)}
                                            >
                                                <Trash2 className="size-4" aria-hidden="true" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0} className="cursor-not-allowed" title="Only the project owner can remove members.">
                                                    <Button variant="ghost" size="icon" className="size-11" disabled aria-label={`Cannot remove ${name}`}>
                                                        <Trash2 className="size-4" aria-hidden="true" />
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>Only the project owner can remove members.</TooltipContent>
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
                        Invite a collaborator
                    </CardTitle>
                    <CardDescription>
                        They get {email ? `${email} ` : ''}added with the role you choose. Owner is never an option.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {atLimit && (
                        <UpgradePrompt
                            title="Member limit reached"
                            description={`This project can have ${data.memberLimit} collaborator${data.memberLimit === 1 ? '' : 's'} on its current plan. ${data.usedSlots} of ${data.memberLimit} collaborator slots are in use.`}
                            ctaLabel="Upgrade your plan"
                            feature="project.members"
                            used={data.usedSlots}
                            limit={data.memberLimit}
                        />
                    )}
                    {!mayManage && (
                        <p className="text-sm text-muted-foreground">
                            Only the project owner can invite members.
                        </p>
                    )}

                    <Form {...form}>
                        <form onSubmit={submitInvite} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Email address</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                autoComplete="email"
                                                placeholder="collaborator@example.com"
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
                                        <FormLabel>Role</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={!mayManage || atLimit}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11" aria-label="Role for the invite">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roles.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {ROLE_LABEL[option]}
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
                                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                                ) : null}
                                Create invite
                            </Button>
                        </form>
                    </Form>
                    <p className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTION[inviteRole]}
                    </p>
                    {!mayManage && (
                        <p className="text-xs text-muted-foreground">
                            Invite controls are disabled because only the owner can manage members.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="size-5" aria-hidden="true" />
                        Pending invites
                    </CardTitle>
                    <CardDescription>Expired invites refresh automatically every minute.</CardDescription>
                </CardHeader>
                <CardContent>
                    {expiredInvites.length > 0 && (
                        <Alert className="mb-4">
                            <Clock />
                            <AlertTitle>Some invites are no longer valid</AlertTitle>
                            <AlertDescription className="flex items-center justify-between gap-3">
                                Expired invites can still be revoked below; revoked and accepted invites are shown for reference.
                                <Button variant="outline" className="h-11" onClick={() => invitesQuery.refetch()}>
                                    Refresh
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                    {invitesQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground" role="status">Loading invites…</p>
                    ) : (invitesQuery.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No pending invites.</p>
                    ) : (
                        <ul className="divide-y divide-border/60" aria-label="Pending invites">
                            {(invitesQuery.data ?? []).map((invite) => (
                                <li key={invite.id} className="flex flex-wrap items-center gap-3 py-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{invite.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {ROLE_LABEL[invite.role]} · invites by owner · {expiresIn(invite.expiresAt)}
                                            {invite.state !== 'pending' ? ` · ${invite.state}` : ''}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-11"
                                        disabled={!mayManage || revokeInvite.isPending || invite.state === 'accepted' || invite.state === 'revoked'}
                                        onClick={() => revokeInvite.mutate(invite.id)}
                                    >
                                        <X className="mr-2 size-4" aria-hidden="true" />
                                        Revoke
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
                        <DialogTitle>Remove this collaborator?</DialogTitle>
                        <DialogDescription>
                            {removeTarget?.user?.email ?? 'This member'} immediately loses access to the project.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" className="h-11" onClick={() => setRemoveTarget(null)}>
                            Keep member
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
                            {removeMember.isPending && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}
                            Remove member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!createdInvite} onOpenChange={(open) => !open && setCreatedInvite(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Invite ready for {createdInvite?.email}</DialogTitle>
                        <DialogDescription>
                            We also try to email this link. Email delivery may not be configured yet, so copy the link to be sure.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center gap-2">
                        <Input readOnly value={createdInvite?.acceptUrl ?? ''} aria-label="Invite link" className="h-11 font-mono text-xs" />
                        <Button type="button" className="h-11" onClick={copyUrl}>
                            <Copy className="mr-2 size-4" aria-hidden="true" />
                            Copy
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Only you can see this link. It expires {createdInvite ? expiresIn(createdInvite.expiresAt) : ''}.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" className="h-11" onClick={() => setCreatedInvite(null)}>
                            <Check className="mr-2 size-4" aria-hidden="true" />
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </TooltipProvider>
    );
}
