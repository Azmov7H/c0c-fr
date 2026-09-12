// Realtime wire contract (frontend mirror of API-04).
// Source of truth: c0c-bake `src/shared/events/event-bus.ts` `WireEventMap`
// (codegen via API-03 will replace this mirror in Sprint 5).

export interface NotificationPayload {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export interface UnreadPayload {
    count: number;
}

export interface ScriptGeneratedPayload {
    userId: string;
    projectId: string;
    status: string;
    scriptId: string;
}

export interface ThumbnailGeneratedPayload {
    userId: string;
    projectId: string;
    status: string;
    thumbnailId: string;
}

export interface AudioGeneratedPayload {
    userId: string;
    projectId: string;
    status: string;
    audioId: string;
}

export interface RoomErrorPayload {
    code: string;
    message: string;
}

/**
 * Client-side mirror of the socket event maps (API-04/FE-10).
 * Source of truth: c0c-bake `ServerToClientEvents`/`ClientToServerEvents`
 * (codegen via API-03 replaces this mirror in Sprint 5). Typing the client
 * socket with these checks event names and payloads at compile time.
 */
export interface ServerToClientEvents {
    notification: (data: NotificationPayload) => void;
    'notification:unread': (data: UnreadPayload) => void;
    'script:generated': (data: ScriptGeneratedPayload) => void;
    'thumbnail:generated': (data: ThumbnailGeneratedPayload) => void;
    'audio:generated': (data: AudioGeneratedPayload) => void;
    'room:error': (data: RoomErrorPayload) => void;
    pong: () => void;
    error: (message: string) => void;
}

export interface ClientToServerEvents {
    'join:project': (projectId: string) => void;
    ping: () => void;
}

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Polling interval matrix (RT-06): the single decision function for
 * notification polling. `null` means "do not poll".
 * - connected: socket delivers → no polling.
 * - connecting: transient → poll at 15s until the socket settles.
 * - disconnected: fallback → poll at 30s.
 * - logged out: nothing polls.
 */
export function getPollingIntervalMs(
    status: RealtimeStatus,
    authenticated: boolean
): number | null {
    if (!authenticated) return null;
    if (status === 'connected') return null;
    if (status === 'connecting') return 15_000;
    return 30_000;
}
