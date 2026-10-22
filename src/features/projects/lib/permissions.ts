import type { ProjectCapability, ProjectMemberRole, ProjectRole } from '../types';

/**
 * Single source of truth for project permissions in the UI.
 *
 * Mirrors c0c-bake `core/guards/project-access.ts` exactly. Every control derives
 * its state from `can()` — never from an inline `role === 'owner'` check, which is
 * how the UI and API drift apart.
 */
export const ROLE_CAPABILITIES: Record<ProjectRole, readonly ProjectCapability[]> = {
    owner: ['read', 'comment', 'edit', 'manage'],
    editor: ['read', 'comment', 'edit'],
    commenter: ['read', 'comment'],
    viewer: ['read'],
};

export const can = (role: ProjectRole | undefined, capability: ProjectCapability): boolean =>
    role ? ROLE_CAPABILITIES[role].includes(capability) : false;

export const PROJECT_ROLES: readonly ProjectMemberRole[] = ['editor', 'commenter', 'viewer'];

export const ROLE_LABEL: Record<ProjectRole, string> = {
    owner: 'Owner',
    editor: 'Editor',
    commenter: 'Commenter',
    viewer: 'Viewer',
};

export const ROLE_DESCRIPTION: Record<ProjectMemberRole, string> = {
    editor: 'Can edit the project and generate assets.',
    commenter: 'Can comment but not change the project.',
    viewer: 'Can view the project and its assets.',
};

/** Roles the actor may grant. `owner` is never grantable (T05). */
export const grantableRoles = (role: ProjectRole | undefined): readonly ProjectMemberRole[] =>
    can(role, 'manage') ? PROJECT_ROLES : [];
