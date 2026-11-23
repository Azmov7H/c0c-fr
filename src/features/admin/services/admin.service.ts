import apiClient from '@/services/api-client';
import type { AdminMe } from '../types';

/**
 * Admin service — read surface consumed by the admin shell (spec §2.3/§5.1).
 *
 * `GET /api/v1/admin/me` is the only call the shell needs for identity and
 * permissions: the role badge, nav filtering, and the account menu all render
 * from it. Mutations go through the BFF (Next API routes) — not this client.
 */
export class AdminService {
    async me(): Promise<AdminMe> {
        const response = await apiClient.get<{ success: boolean; data: AdminMe }>('/admin/me');
        return response.data.data;
    }
}

export const adminService = new AdminService();
