import type { Socket } from 'socket.io-client';

/**
 * The socket is created inside `useWebSocket`, far from the workspace. This tiny
 * registry is the seam that lets a page join its project room without turning the
 * socket into React context (and without a second connection).
 */
let activeSocket: Socket | null = null;
const joinedRooms = new Set<string>();
const pendingRooms = new Set<string>();

export function registerSocket(socket: Socket | null): void {
    activeSocket = socket;
    if (!socket) {
        joinedRooms.clear();
        pendingRooms.clear();
        return;
    }
    // A reconnect creates a new connection, so room membership must be replayed.
    socket.on('connect', () => {
        joinedRooms.clear();
        for (const room of pendingRooms) {
            socket.emit('join:project', room);
            joinedRooms.add(room);
        }
    });
}

export function joinProjectRoom(projectId: string): void {
    pendingRooms.add(projectId);
    if (!activeSocket || joinedRooms.has(projectId) || !activeSocket.connected) return;
    activeSocket.emit('join:project', projectId);
    joinedRooms.add(projectId);
}

export function leaveProjectRoom(projectId: string): void {
    pendingRooms.delete(projectId);
    joinedRooms.delete(projectId);
}
