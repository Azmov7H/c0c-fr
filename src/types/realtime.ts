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

/** D5 — terminal state of an async generation job (success or failure). */
export interface GenerationCompletedPayload {
    userId: string;
    projectId: string;
    jobId: string;
    kind: string;
    status: 'completed' | 'failed';
    scriptId?: string;
    error?: string;
}

/** A8 — HTTP polling stays authoritative; this invalidates open tabs. */
export interface AdvertisementRenderUpdatedPayload {
    userId: string;
    projectId: string;
    advertisementId: string;
    jobId: string;
    status:
        | 'queued'
        | 'rendering'
        | 'processing-audio'
        | 'finalizing'
        | 'completed'
        | 'failed'
        | 'cancelled';
}

/** Backend-owned content preparation status; the UI reflects, never derives. */
export interface PreparationUpdatedPayload {
    userId: string;
    projectId: string;
    preparationId: string;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
    resourceKind?: 'script' | 'voiceover' | 'music' | 'images' | 'sfx' | 'seo';
    resourceStatus?: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'skipped';
    contentPackageReady: boolean;
}

export interface ProjectUpdatedPayload {
    projectId: string;
    userId: string;
}

export interface MemberChangedPayload {
    projectId: string;
    userId?: string;
    addedBy?: string;
    removedBy?: string;
    changedBy?: string;
    role?: string;
}

export interface InviteChangedPayload {
    projectId: string;
    inviteId: string;
    email?: string;
    invitedBy?: string;
    userId?: string;
    role?: string;
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
    'generation:completed': (data: GenerationCompletedPayload) => void;
    'thumbnail:generated': (data: ThumbnailGeneratedPayload) => void;
    'audio:generated': (data: AudioGeneratedPayload) => void;
    'advertisement:render.updated': (data: AdvertisementRenderUpdatedPayload) => void;
    'preparation:updated': (data: PreparationUpdatedPayload) => void;
    'project:updated': (data: ProjectUpdatedPayload) => void;
    'project.member_added': (data: MemberChangedPayload) => void;
    'project.member_removed': (data: MemberChangedPayload) => void;
    'project.member_role_changed': (data: MemberChangedPayload) => void;
    'project.invite_created': (data: InviteChangedPayload) => void;
    'project.invite_accepted': (data: InviteChangedPayload) => void;
    'project.invite_revoked': (data: InviteChangedPayload) => void;
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
