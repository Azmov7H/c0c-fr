import { useAuthStore } from '@/store/auth-store';
import { useRealtimeStore } from '@/store/realtime-store';
import type { RealtimeStatus } from '@/types/realtime';

/**
 * Single source of truth for realtime transport state (RT-06).
 * - 'connected': socket authenticated and live → polling stops.
 * - 'connecting': logged in but socket not up (retrying) → polling fallback.
 * - 'disconnected': logged out → nothing polls, socket torn down.
 */
export function useRealtimeStatus(): RealtimeStatus {
    const user = useAuthStore((s) => s.user);
    const isConnected = useRealtimeStore((s) => s.isConnected);

    if (!user) return 'disconnected';
    if (isConnected) return 'connected';
    return 'connecting';
}
