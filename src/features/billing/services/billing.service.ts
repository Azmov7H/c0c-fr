import apiClient from '@/services/api-client';
import type { ApiResponse } from '@/types';
import type { BillingSummary, CheckoutSession, PlanId, PortalSession } from '../types';

class BillingService {
    private readonly baseUrl = '/billing';

    async getSubscription(): Promise<BillingSummary> {
        const response = await apiClient.get<ApiResponse<BillingSummary>>(
            `${this.baseUrl}/subscription`
        );
        return response.data.data;
    }

    async createCheckoutSession(plan: PlanId): Promise<CheckoutSession> {
        const response = await apiClient.post<ApiResponse<CheckoutSession>>(
            `${this.baseUrl}/checkout-session`,
            { plan }
        );
        return response.data.data;
    }

    async createPortalSession(): Promise<PortalSession> {
        const response = await apiClient.post<ApiResponse<PortalSession>>(
            `${this.baseUrl}/portal-session`,
            {}
        );
        return response.data.data;
    }
}

export const billingService = new BillingService();
