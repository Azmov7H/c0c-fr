import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Socket } from 'socket.io-client';

import { joinProjectRoom, leaveProjectRoom, registerSocket } from './socket-registry';

/**
 * T18 — the join/replay contract for the single shared socket (RT-02/FE-01):
 * a page requests a room before the socket exists (mount races the HS
 * handshake), the registry buffers it, and every later `connect` replays the
 * buffer — because a socket.io reconnect creates a NEW connection whose room
 * membership starts empty. Without the replay a reconnecting user silently
 * loses live updates.
 */
type Fake = Socket & { fireConnect(): void; emitted: Array<[string, unknown]> };

function makeSocket(connected = true): Fake {
    const handlers = new Map<string, () => void>();
    const emitted: Array<[string, unknown]> = [];
    const socket = {
        connected,
        emit: vi.fn((event: string, room?: unknown) => {
            emitted.push([event, room]);
        }),
        on: vi.fn((event: string, cb: () => void) => {
            handlers.set(event, cb);
        }),
        fireConnect: () => handlers.get('connect')?.(),
        emitted,
    } as unknown as Fake;
    return socket;
}

describe('socket-registry room bookkeeping', () => {
    beforeEach(() => {
        registerSocket(null); // reset the module singleton between tests
    });

    afterEach(() => {
        registerSocket(null);
    });

    it('emits join:project immediately for a connected socket registered BEFORE the join', () => {
        const socket = makeSocket(true);
        registerSocket(socket);
        joinProjectRoom('p1');

        expect(socket.emitted).toEqual([['join:project', 'p1']]);
    });

    it('buffers the join when the socket is not connected yet and replays it on connect', () => {
        const socket = makeSocket(false);
        registerSocket(socket);
        joinProjectRoom('p1');
        expect(socket.emitted).toEqual([]); // handshake not finished — still buffered

        socket.fireConnect();
        expect(socket.emitted).toEqual([['join:project', 'p1']]);
    });

    it('replays buffered rooms on EVERY connect (socket.io room membership is per-connection)', () => {
        const socket = makeSocket(true);
        registerSocket(socket);
        joinProjectRoom('p1');
        expect(socket.emitted).toEqual([['join:project', 'p1']]);

        // Simulated reconnect: the same room must be joined on the new
        // connection, otherwise live updates stop after a dropped socket.
        socket.fireConnect();
        expect(socket.emitted).toEqual([
            ['join:project', 'p1'],
            ['join:project', 'p1'],
        ]);
    });

    it('a repeated join of the same live room is not emitted twice', () => {
        const socket = makeSocket(true);
        registerSocket(socket);
        joinProjectRoom('p1');
        joinProjectRoom('p1');
        expect(socket.emitted).toEqual([['join:project', 'p1']]);
    });

    it('schedules the join even with no socket at all (page mounts before any connection)', () => {
        // No registerSocket call — join buffered; later socket replays it.
        joinProjectRoom('p1');
        const socket = makeSocket(true);
        registerSocket(socket);
        socket.fireConnect();
        expect(socket.emitted).toEqual([['join:project', 'p1']]);
    });

    it('leave drops the room immediately and from future reconnect replays', () => {
        const socket = makeSocket(false);
        registerSocket(socket);
        joinProjectRoom('p1');
        leaveProjectRoom('p1');

        socket.fireConnect();
        expect(socket.emitted).toEqual([]);
    });

    it('registering null (teardown) wipes every pending and joined room', () => {
        const first = makeSocket(true);
        registerSocket(first);
        joinProjectRoom('p1');
        leaveProjectRoom('p1');

        // Register a fresh socket AFTER the teardown: the old room must not
        // leak into the new connection.
        const second = makeSocket(true);
        registerSocket(second);
        second.fireConnect();
        expect(second.emitted).toEqual([]);
    });
});
