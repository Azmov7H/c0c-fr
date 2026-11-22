'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useTeams, useCreateTeam, useInviteMember, useRemoveMember } from '../hooks/use-teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
    Users,
    UserPlus,
    UserMinus,
    Shield,
    Plus,
    Settings,
    User as UserIcon,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DataState } from '@/components/shared/data-state';
import { PageHeader } from '@/components/shared/page-header';

/**
 * T20: `@tanstack/react-table` is only needed once a team exists. Deferring it
 * keeps the table runtime (and the pagination primitives it pulls in) out of
 * the first-load bundle; the skeleton matches the roster's row height.
 */
const DataTable = dynamic(() => import('@/components/ui/data-table').then((mod) => mod.DataTable), {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full rounded-xl" />,
}) as typeof import('@/components/ui/data-table').DataTable;
import { TeamRole, type TeamMember } from '../types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const TeamManagement = () => {
    const t = useTranslations('team');
    const { data: teams, isLoading, error } = useTeams();
    const { mutate: createTeam, isPending: isCreatingTeam } = useCreateTeam();
    const { mutate: inviteMember, isPending: isInviting } = useInviteMember();
    const { mutate: removeMember } = useRemoveMember();

    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const createTeamSchema = useMemo(() => z.object({
        name: z.string().trim().min(2, t('create.nameMin')).max(80),
    }), [t]);

    const inviteSchema = useMemo(() => z.object({
        email: z.string().trim().email(t('invite.emailInvalid')).max(254),
        role: z.enum(['admin', 'editor', 'viewer']),
    }), [t]);

    type CreateTeamValues = z.infer<typeof createTeamSchema>;
    type InviteValues = z.infer<typeof inviteSchema>;

    const createForm = useForm<CreateTeamValues>({
        resolver: zodResolver(createTeamSchema),
        defaultValues: { name: '' },
        mode: 'onChange',
    });

    const inviteForm = useForm<InviteValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { email: '', role: 'editor' },
        mode: 'onChange',
    });

    const activeTeam = teams && teams.length > 0 ? (selectedTeamId ? teams.find(t => t.id === selectedTeamId) : teams[0]) : null;

    const handleCreateTeam = createForm.handleSubmit((values) => {
        createTeam(values, {
            onSuccess: () => {
                createForm.reset({ name: '' });
                setCreateOpen(false);
            },
        });
    });

    const handleInvite = inviteForm.handleSubmit((values) => {
        if (!activeTeam) return;
        inviteMember(
            {
                teamId: activeTeam.id,
                data: { email: values.email, role: values.role as TeamRole },
            },
            { onSuccess: () => inviteForm.reset({ email: '', role: values.role }) }
        );
    });

    const roleColors = {
        owner: 'bg-primary/10 text-primary border-primary/20',
        admin: 'bg-brand-violet/10 text-brand-violet border-brand-violet/20',
        editor: 'bg-info/10 text-info border-info/20',
        viewer: 'bg-muted text-muted-foreground border-border/50',
    };

    if (isLoading || error) {
        return (
            <DataState
                isLoading={isLoading}
                error={error}
                loadingFallback={
                    <div className="space-y-8">
                        <div className="flex justify-between">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <Skeleton className="h-96 w-full rounded-2xl" />
                    </div>
                }
            >
                {null}
            </DataState>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <PageHeader
                title={t('page.title')}
                description={t('page.description')}
                actions={
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 me-2" />
                            {t('actions.newWorkspace')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('create.title')}</DialogTitle>
                            <DialogDescription>{t('create.description')}</DialogDescription>
                        </DialogHeader>
                        <Form {...createForm}>
                            <form onSubmit={handleCreateTeam} className="py-4" noValidate>
                                <FormField
                                    control={createForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('create.nameLabel')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t('create.namePlaceholder')} className="h-11" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="mt-6">
                                    <Button type="submit" className="h-11" disabled={isCreatingTeam}>
                                        {isCreatingTeam ? t('actions.creating') : t('actions.createWorkspace')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                    </Dialog>
                }
            />

            {!activeTeam ? (
                <DataState
                    isEmpty
                    emptyIcon={Users}
                    emptyTitle={t('empty.title')}
                    emptyDescription={t('empty.description')}
                    emptyAction={{ label: t('actions.createFirstTeam'), onClick: () => setCreateOpen(true) }}
                >
                    {null}
                </DataState>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Team Switcher & Header */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">{t('workspaces.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {teams?.map(team => (
                                    <button
                                        key={team.id}
                                        type="button"
                                        onClick={() => setSelectedTeamId(team.id)}
                                        aria-pressed={activeTeam.id === team.id}
                                        aria-current={activeTeam.id === team.id ? 'true' : undefined}
                                        className={`flex w-full items-center justify-between p-3 rounded-lg cursor-pointer transition-all border text-start ${activeTeam.id === team.id ? 'bg-primary/10 border-primary/30 text-primary' : 'hover:bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${activeTeam.id === team.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {team.name.slice(0, 2).toUpperCase()}
                                            </span>
                                            <span className="text-sm font-medium">{team.name}</span>
                                        </span>
                                        {activeTeam.id === team.id && <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-primary" /> {t('invite.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form {...inviteForm}>
                                    <form onSubmit={handleInvite} className="space-y-4" noValidate>
                                        <FormField
                                            control={inviteForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('invite.emailLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" placeholder={t('invite.emailPlaceholder')} className="h-11" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={inviteForm.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('invite.roleLabel')}</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11" aria-label={t('invite.roleAria')}>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                                                            <SelectItem value="editor">{t('roles.editor')}</SelectItem>
                                                            <SelectItem value="viewer">{t('roles.viewer')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="mt-2 h-11 w-full" disabled={isInviting}>
                                            {isInviting ? <RefreshCw className="animate-spin w-4 h-4 me-2" /> : <UserPlus className="w-4 h-4 me-2" />}
                                            {t('actions.sendInvitation')}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Members List */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <div>
                                <CardTitle className="text-lg">{t('members.title')}</CardTitle>
                                <CardDescription>{t('members.count', { count: activeTeam.members.length })}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 me-2" />
                                {t('actions.teamSettings')}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={[
                                    {
                                        id: 'member',
                                        accessorFn: (m) => `${m.user.firstName} ${m.user.lastName}`,
                                        header: t('members.columnMember'),
                                        cell: ({ row }) => (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                                                    <UserIcon className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold flex items-center gap-2">
                                                        {row.original.user.firstName} {row.original.user.lastName}
                                                        {row.original.user.id === activeTeam.owner.id && <Shield className="w-3 h-3 text-warning" />}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{row.original.user.email}</p>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        accessorKey: 'role',
                                        header: t('members.columnRole'),
                                        cell: ({ row }) => (
                                            <Badge variant="outline" className={`capitalize font-mono text-[10px] ${roleColors[row.original.role]}`}>
                                                {t(`roles.${row.original.role}` as never)}
                                            </Badge>
                                        ),
                                    },
                                    {
                                        id: 'actions',
                                        header: '',
                                        enableSorting: false,
                                        cell: ({ row }) =>
                                            row.original.role !== TeamRole.OWNER && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeMember({ teamId: activeTeam.id, userId: row.original.user.id })}
                                                    aria-label={t('members.removeAria')}
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </Button>
                                            ),
                                    },
                                ] satisfies ColumnDef<TeamMember>[]}
                                data={activeTeam.members}
                                emptyMessage={t('members.empty')}
                                className="rounded-none border-0 border-t"
                            />
                        </CardContent>
                    </Card>

                </div>
            )}

        </div>
    );
};
