import { describe, expect, it } from 'vitest';

import {
    can,
    grantableRoles,
    PROJECT_ROLES,
    ROLE_CAPABILITIES,
    ROLE_DESCRIPTION,
    ROLE_LABEL,
} from './permissions';
import type { ProjectCapability, ProjectMemberRole, ProjectRole } from '../types';

/** The backend matrix (c0c-bake core/guards/project-access.ts). This copy is
 *  the contract: if the backend's matrix changes, this constant must change
 *  with it — the table test below fails on any drift between the two shapes.
 */
const BACKEND_MATRIX: Record<ProjectRole, readonly ProjectCapability[]> = {
    owner: ['read', 'comment', 'edit', 'manage'],
    editor: ['read', 'comment', 'edit'],
    commenter: ['read', 'comment'],
    viewer: ['read'],
};

const ALL_CAPABILITIES: readonly ProjectCapability[] = ['read', 'comment', 'edit', 'manage'];
const ALL_ROLES: readonly (ProjectRole | undefined)[] = [undefined, 'viewer', 'commenter', 'editor', 'owner'];

describe('project permissions — table over every role × capability', () => {
    it('can() agrees with the backend matrix for the full role × capability table', () => {
        for (const role of ALL_ROLES) {
            for (const capability of ALL_CAPABILITIES) {
                const expected = role ? BACKEND_MATRIX[role].includes(capability) : false;
                if (can(role, capability) !== expected) {
                    throw new Error(
                        `drift: can(${role ?? 'none'}, ${capability}) ≠ backend ${String(expected)}`
                    );
                }
            }
        }
    });

    it('can() round-trips ROLE_CAPABILITIES exactly (no hidden extra capability anywhere)', () => {
        for (const [role, capability] of Object.entries(ROLE_CAPABILITIES)) {
            for (const capability_ of ALL_CAPABILITIES) {
                expect(can(role as ProjectRole, capability_)).toBe(
                    (capability as readonly ProjectCapability[]).includes(capability_)
                );
            }
        }
    });

    it('every role declares at least `read` (cannot grant a member role that cannot see the project)', () => {
        for (const [role, caps] of Object.entries(ROLE_CAPABILITIES)) {
            expect({
                role,
                hasRead: (caps as readonly ProjectCapability[]).includes('read'),
                label: ROLE_LABEL[role as ProjectRole],
                labelLength: ROLE_LABEL[role as ProjectRole]?.length,
                // ROLE_DESCRIPTION is defined for the three grantable member roles
                // only — the OWNER never appears in the role picker (forEach keeps
                // it out deliberately), and indexing it with 'owner' is the bug
                // this guard is about.
                descriptionLength:
                    role === 'owner' ? undefined : ROLE_DESCRIPTION[role as ProjectMemberRole]?.length,
            }).toMatchObject({ hasRead: true });
        }
    });

    it('labels and descriptions exist for every role (picker renders no blank option)', () => {
        expect(Object.keys(ROLE_LABEL)).toEqual(Object.keys(BACKEND_MATRIX));
        expect(Object.keys(ROLE_DESCRIPTION).sort()).toEqual(PROJECT_ROLES.map(String).sort());

        for (const text of Object.values(ROLE_DESCRIPTION)) {
            expect(text.length).toBeGreaterThan(10);
        }
    });
});

describe('project permissions — grant surface', () => {
    it('mirrors the backend capability matrix', () => {
        expect(can('editor', 'manage')).toBe(false);
        expect(can('commenter', 'edit')).toBe(false);
        expect(can('viewer', 'comment')).toBe(false);
        expect(can(undefined, 'read')).toBe(false);
    });

    it('never offers owner as a grantable role', () => {
        expect(grantableRoles('owner')).toEqual(PROJECT_ROLES);
        expect(grantableRoles('owner')).not.toContain('owner');
        expect(grantableRoles('editor')).toEqual([]);
    });
});
