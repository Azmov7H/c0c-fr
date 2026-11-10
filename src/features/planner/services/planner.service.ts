import apiClient from '@/services/api-client';
import type { PaginatedMeta } from '@/types';

export interface PlannerEvent {
    _id: string;
    userId: string;
    projectId?: string;
    title: string;
    description?: string;
    type: 'publish' | 'schedule' | 'review' | 'draft' | 'meeting';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    /** UTC instant. */
    scheduledDate: string;
    /** P02.1: IANA zone the client scheduled in (write-validated). */
    timezone?: string;
    /** P02.3: YYYY-MM-DD day key IN THE STORED ZONE, computed server-side — the one value both views read. */
    scheduledDay?: string;
    platform?: 'youtube' | 'tiktok' | 'instagram';
    contentUrl?: string;
    notes?: string;
    /** P02.2: stored metadata only — no dispatch path exists yet; the UI must say so, never pretend reminders fire. */
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
    }): Promise<{ data: PlannerEvent[]; meta: PaginatedMeta }> {
        const { data } = await apiClient.get<{ data: PlannerEvent[]; meta: PaginatedMeta }>('/planner/events', { params });
        return { data: data.data, meta: data.meta };
    },

    async getById(id: string): Promise<PlannerEvent> {
        const { data } = await apiClient.get<{ data: PlannerEvent }>(`/planner/events/${id}`);
        return data.data;
    },

    async create(dto: Partial<PlannerEvent>): Promise<PlannerEvent> {
        // P02.1: the zone travels from the client unless the caller picked
        // one explicitly — an event is only honest if its zone is real.
        const withZone = {
            ...dto,
            timezone: dto.timezone ?? new Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        const { data } = await apiClient.post<{ data: PlannerEvent }>('/planner/events', withZone);
        return data.data;
    },

    async update(id: string, dto: Partial<PlannerEvent>): Promise<PlannerEvent> {
        const { data } = await apiClient.patch<{ data: PlannerEvent }>(`/planner/events/${id}`, dto);
        return data.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/planner/events/${id}`);
    },
};
