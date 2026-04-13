import apiClient from '@/services/api-client';

export interface PlannerEvent {
    _id: string;
    userId: string;
    projectId?: string;
    title: string;
    description?: string;
    type: 'publish' | 'schedule' | 'review' | 'draft' | 'meeting';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    scheduledDate: string;
    platform?: 'youtube' | 'tiktok' | 'instagram';
    contentUrl?: string;
    notes?: string;
    reminders?: string[];
    createdAt: string;
    updatedAt: string;
}

export const plannerService = {
    async getEvents(params?: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        projectId?: string;
    }): Promise<{ data: PlannerEvent[]; meta: any }> {
        const { data } = await apiClient.get('/planner/events', { params });
        return { data: data.data, meta: data.meta };
    },

    async getById(id: string): Promise<PlannerEvent> {
        const { data } = await apiClient.get(`/planner/events/${id}`);
        return data.data;
    },

    async create(dto: Partial<PlannerEvent>): Promise<PlannerEvent> {
        const { data } = await apiClient.post('/planner/events', dto);
        return data.data;
    },

    async update(id: string, dto: Partial<PlannerEvent>): Promise<PlannerEvent> {
        const { data } = await apiClient.patch(`/planner/events/${id}`, dto);
        return data.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/planner/events/${id}`);
    },
};
