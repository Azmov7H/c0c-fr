'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useTeams, useCreateTeam, useInviteMember, useRemoveMember } from '../hooks/use-teams';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Users,
    UserPlus,
    UserMinus,
    Shield,
    Mail,
    Plus,
    Settings,
    User as UserIcon,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { DataState } from '@/components/shared/data-state';
import { PageHeader } from '@/components/shared/page-header';
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
    const { data: teams, isLoading, error } = useTeams();
    const { mutate: createTeam, isPending: isCreatingTeam } = useCreateTeam();
    const { mutate: inviteMember, isPending: isInviting } = useInviteMember();
    const { mutate: removeMember } = useRemoveMember();

    const [newTeamName, setNewTeamName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<TeamRole>(TeamRole.EDITOR);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const activeTeam = teams && teams.length > 0 ? (selectedTeamId ? teams.find(t => t.id === selectedTeamId) : teams[0]) : null;

    const handleCreateTeam = () => {
        if (!newTeamName.trim()) return;
        createTeam({ name: newTeamName });
        setNewTeamName('');
    };

    const handleInvite = () => {
        if (!activeTeam || !inviteEmail.trim()) return;
        inviteMember({
            teamId: activeTeam.id,
            data: { email: inviteEmail, role: inviteRole }
        });
        setInviteEmail('');
    };

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
                title="Workspace Teams"
                description="Manage collaborators and permissions for your AI projects"
                actions={
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Workspace
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Team Workspace</DialogTitle>
                            <DialogDescription>Workspaces allow you to group projects and collaborators together.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Workspace Name</Label>
                                <Input
                                    id="name"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="e.g. Marketing House"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateTeam} disabled={isCreatingTeam}>
                                {isCreatingTeam ? 'Creating...' : 'Create Workspace'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                    </Dialog>
                }
            />

            {!activeTeam ? (
                <DataState
                    isEmpty
                    emptyIcon={Users}
                    emptyTitle="You don't belong to any teams yet"
                    emptyDescription="Create your first workspace to start collaborating with other AI content creators."
                    emptyAction={{ label: "Create Your First Team", onClick: () => setCreateOpen(true) }}
                >
                    {null}
                </DataState>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Team Switcher & Header */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Your Workspaces</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {teams?.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTeamId(t.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${activeTeam.id === t.id ? 'bg-primary/10 border-primary/30 text-primary' : 'hover:bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${activeTeam.id === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                {t.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium">{t.name}</span>
                                        </div>
                                        {activeTeam.id === t.id && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-primary" /> Invite Collaborator
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">User Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="colleague@agency.com"
                                            className="pl-10"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Assign Role</Label>
                                    <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as TeamRole)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrator</SelectItem>
                                            <SelectItem value="editor">Content Editor</SelectItem>
                                            <SelectItem value="viewer">Viewer Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full mt-2" onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                                    {isInviting ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                    Send Invitation
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Members List */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <div>
                                <CardTitle className="text-lg">Members & Permissions</CardTitle>
                                <CardDescription>{activeTeam.members.length} active users in this workspace</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Team Settings
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={[
                                    {
                                        id: 'member',
                                        accessorFn: (m) => `${m.user.firstName} ${m.user.lastName}`,
                                        header: 'Member',
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
                                        header: 'Role',
                                        cell: ({ row }) => (
                                            <Badge variant="outline" className={`capitalize font-mono text-[10px] ${roleColors[row.original.role]}`}>
                                                {row.original.role}
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
                                                    aria-label="Remove member from team"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </Button>
                                            ),
                                    },
                                ] satisfies ColumnDef<TeamMember>[]}
                                data={activeTeam.members}
                                emptyMessage="No members yet."
                                className="rounded-none border-0 border-t"
                            />
                        </CardContent>
                    </Card>

                </div>
            )}

        </div>
    );
};
