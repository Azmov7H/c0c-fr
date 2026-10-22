export type ProjectMemberRole = 'editor' | 'commenter' | 'viewer';
export type ProjectRole = 'owner' | ProjectMemberRole;
export type ProjectCapability = 'read' | 'comment' | 'edit' | 'manage';

export interface MemberUser {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
}

export interface ProjectMember {
    userId: string;
    role: ProjectMemberRole;
    joinedAt: string;
    user: MemberUser | null;
}

export interface ProjectMembersResponse {
    projectId: string;
    owner: {
        userId: string;
        role: 'owner';
        user: MemberUser | null;
    };
    members: ProjectMember[];
    memberLimit: number;
    usedSlots: number;
}

export type InviteState = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface ProjectInvite {
    id: string;
    email: string;
    role: ProjectMemberRole;
    invitedBy: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
    revokedAt: string | null;
    state: InviteState;
}

export interface CreateInviteResponse {
    inviteId: string;
    projectId: string;
    email: string;
    role: ProjectMemberRole;
    expiresAt: string;
    acceptUrl: string;
}

export interface InvitePreview {
    projectName: string;
    inviterName: string;
    role: ProjectMemberRole;
    expiresIn: number;
}

export type ProjectActivityType =
    | 'member_added'
    | 'member_removed'
    | 'member_role_changed'
    | 'invite_created'
    | 'invite_accepted'
    | 'invite_revoked'
    | 'script_generated'
    | 'thumbnail_generated'
    | 'audio_generated';

export interface ProjectActivityItem {
    id: string;
    type: ProjectActivityType;
    target: string;
    role: string | null;
    createdAt: string;
    actor: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string | null;
    } | null;
}
