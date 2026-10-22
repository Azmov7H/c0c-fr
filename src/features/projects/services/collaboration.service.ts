import apiClient from '@/services/api-client';
import type { ApiResponse, PaginatedResponse, PaginatedMeta } from '@/types';
import type {
    CreateInviteResponse,
    InvitePreview,
    ProjectActivityItem,
    ProjectInvite,
    ProjectMemberRole,
    ProjectMembersResponse,
} from '../types';

export const projectMembersService = {
    async list(projectId: string): Promise<ProjectMembersResponse> {
        const response = await apiClient.get<ApiResponse<ProjectMembersResponse>>(
            `/projects/${projectId}/members`
        );
        return response.data.data;
    },

    async updateRole(
        projectId: string,
        userId: string,
        role: ProjectMemberRole
    ): Promise<void> {
        await apiClient.patch(`/projects/${projectId}/members/${userId}`, { role });
    },

    async remove(projectId: string, userId: string): Promise<void> {
        await apiClient.delete(`/projects/${projectId}/members/${userId}`);
    },
};

export const projectInvitesService = {
    async list(projectId: string): Promise<ProjectInvite[]> {
        const response = await apiClient.get<ApiResponse<ProjectInvite[]>>(
            `/projects/${projectId}/invites`,
            { params: { status: 'pending' } }
        );
        return response.data.data;
    },

    async create(
        projectId: string,
        data: { email: string; role: ProjectMemberRole }
    ): Promise<CreateInviteResponse> {
        const response = await apiClient.post<ApiResponse<CreateInviteResponse>>(
            `/projects/${projectId}/invites`,
            data
        );
        return response.data.data;
    },

    async revoke(projectId: string, inviteId: string): Promise<void> {
        await apiClient.delete(`/projects/${projectId}/invites/${inviteId}`);
    },

    async preview(token: string): Promise<InvitePreview> {
        const response = await apiClient.get<ApiResponse<InvitePreview>>(`/invites/${token}`);
        return response.data.data;
    },

    async accept(token: string): Promise<{ projectId: string; role: string; accepted: boolean }> {
        const response = await apiClient.post<
            ApiResponse<{ projectId: string; role: string; accepted: boolean }>
        >(`/invites/${token}/accept`);
        return response.data.data;
    },
};

export const projectActivityService = {
    async list(
        projectId: string,
        params: { type?: string; page?: number; limit?: number }
    ): Promise<{ items: ProjectActivityItem[]; meta: PaginatedMeta }> {
        const response = await apiClient.get<PaginatedResponse<ProjectActivityItem>>(
            `/projects/${projectId}/activity`,
            { params }
        );
        return { items: response.data.data, meta: response.data.meta };
    },
};
