import apiClient from '@/services/api-client';
import type { ApiResponse, PaginatedMeta } from '@/types';
import type {
    BillingSummary,
    CheckoutSession,
    CreditBalance,
    CreditHistoryPage,
    PlanId,
    PortalSession,
} from '../types';

class BillingService {
    private readonly baseUrl = '/billing';

    async getSubscription(): Promise<BillingSummary> {
        const response = await apiClient.get<ApiResponse<BillingSummary>>(
            `${this.baseUrl}/subscription`
        );
        return response.data.data;
    }

    async getCredits(): Promise<CreditBalance> {
        const response = await apiClient.get<ApiResponse<CreditBalance>>(
            `${this.baseUrl}/credits`
        );
        return response.data.data;
    }

    async getCreditHistory(page = 1, limit = 20): Promise<CreditHistoryPage> {
        const response = await apiClient.get<
            ApiResponse<{ events: CreditHistoryPage['events']; meta: PaginatedMeta }>
        >(`${this.baseUrl}/credits/history`, { params: { page, limit } });
        return {
            events: response.data.data.events,
            total: response.data.data.meta.total,
            limit,
        };
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
