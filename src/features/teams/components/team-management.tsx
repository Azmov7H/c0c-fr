'use client';

import { useState } from 'react';
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
    Trash2,
    User as UserIcon,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TeamRole } from '../types';
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
    const { data: teams, isLoading } = useTeams();
    const { mutate: createTeam, isPending: isCreatingTeam } = useCreateTeam();
    const { mutate: inviteMember, isPending: isInviting } = useInviteMember();
    const { mutate: removeMember } = useRemoveMember();

    const [newTeamName, setNewTeamName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<TeamRole>(TeamRole.EDITOR);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

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
        admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        editor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        viewer: 'bg-muted text-muted-foreground border-border/50',
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        Workspace Teams
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage collaborators and permissions for your AI projects</p>
                </div>

                <Dialog>
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
            </div>

            {!activeTeam ? (
                <Card className="border-dashed border-2 py-20">
                    <CardContent className="flex flex-col items-center text-center">
                        <Users className="w-16 h-16 text-muted-foreground/30 mb-6" />
                        <h3 className="text-xl font-semibold mb-2">You don&apos;t belong to any teams yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-8">Create your first workspace to start collaborating with other AI content creators.</p>
                        <Button>Create Your First Team</Button>
                    </CardContent>
                </Card>
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
                            <div className="divide-y">
                                {activeTeam.members.map((member) => (
                                    <div key={member.user.id} className="flex items-center justify-between p-6 hover:bg-muted/40 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                                                <UserIcon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold flex items-center gap-2">
                                                    {member.user.firstName} {member.user.lastName}
                                                    {member.user.id === activeTeam.owner.id && <Shield className="w-3 h-3 text-amber-500" />}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <Badge variant="outline" className={`capitalize font-mono text-[10px] ${roleColors[member.role]}`}>
                                                {member.role}
                                            </Badge>

                                            <div className="hidden group-hover:block transition-all animate-in fade-in slide-in-from-right-2">
                                                {member.role !== TeamRole.OWNER && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeMember({ teamId: activeTeam.id, userId: member.user.id })}
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            )}

        </div>
    );
};
