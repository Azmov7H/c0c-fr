export enum TeamRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    EDITOR = 'editor',
    VIEWER = 'viewer',
}

export interface TeamMember {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
    role: TeamRole;
    joinedAt: string;
}

export interface Team {
    id: string;
    name: string;
    owner: {
        id: string;
        email: string;
    };
    members: TeamMember[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateTeamDTO {
    name: string;
}

export interface InviteMemberDTO {
    email: string;
    role: TeamRole;
}
