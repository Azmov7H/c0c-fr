'use client';

import { useWebSocket } from '@/hooks/use-websocket';

/**
 * Initializes WebSocket connection when user is authenticated.
 * This component renders nothing - it only activates the hook.
 */
export function WebSocketInitializer() {
    useWebSocket();
    return null;
}
