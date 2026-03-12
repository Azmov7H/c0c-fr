import apiClient from '@/services/api-client';
import { Team, CreateTeamDTO, InviteMemberDTO } from '../types';
import { ApiResponse } from '@/types';

class TeamsService {
    private readonly baseUrl = '/teams';

    async listTeams(): Promise<Team[]> {
        const response = await apiClient.get<ApiResponse<Team[]>>(this.baseUrl);
        return response.data.data;
    }

    async getTeam(id: string): Promise<Team> {
        const response = await apiClient.get<ApiResponse<Team>>(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    async createTeam(data: CreateTeamDTO): Promise<Team> {
        const response = await apiClient.post<ApiResponse<Team>>(this.baseUrl, data);
        return response.data.data;
    }

    async inviteMember(teamId: string, data: InviteMemberDTO): Promise<Team> {
        const response = await apiClient.post<ApiResponse<Team>>(`${this.baseUrl}/${teamId}/invite`, data);
        return response.data.data;
    }

    async removeMember(teamId: string, userId: string): Promise<Team> {
        const response = await apiClient.delete<ApiResponse<Team>>(`${this.baseUrl}/${teamId}/members`, {
            data: { userId }
        });
        return response.data.data;
    }
}

export const teamsService = new TeamsService();
