import { create } from 'zustand';

interface RealtimeState {
    isConnected: boolean;
    setConnected: (connected: boolean) => void;
}

/**
 * Shared socket connection state (RT-06). Written by the single
 * `useWebSocket` instance, read by `useRealtimeStatus` and any other
 * consumer — no duplicate sockets.
 */
export const useRealtimeStore = create<RealtimeState>()((set) => ({
    isConnected: false,
    setConnected: (isConnected) => set({ isConnected }),
}));
