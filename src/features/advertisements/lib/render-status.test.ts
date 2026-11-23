import { describe, expect, it } from 'vitest';

import type { RenderJobStatus } from '../types';
import {
    TERMINAL_RENDER_STATUSES,
    isActiveRenderStatus,
    isTerminalRenderStatus,
    renderPollIntervalMs,
} from './render-status';

const ACTIVE: RenderJobStatus[] = ['queued', 'rendering', 'processing-audio', 'finalizing'];

describe('advertisement render polling', () => {
    it('treats only completed, failed and cancelled as terminal', () => {
        expect(TERMINAL_RENDER_STATUSES).toEqual(['completed', 'failed', 'cancelled']);
        for (const status of ACTIVE) {
            expect(isActiveRenderStatus(status), status).toBe(true);
            expect(isTerminalRenderStatus(status), status).toBe(false);
        }
        for (const status of TERMINAL_RENDER_STATUSES) {
            expect(isActiveRenderStatus(status), status).toBe(false);
            expect(isTerminalRenderStatus(status), status).toBe(true);
        }
    });

    it('keeps polling while a job is live and stops at every terminal state', () => {
        for (const status of ACTIVE) {
            expect(renderPollIntervalMs(status), status).toBe(2_000);
        }
        expect(renderPollIntervalMs(undefined)).toBe(2_000);
        for (const status of TERMINAL_RENDER_STATUSES) {
            expect(renderPollIntervalMs(status), status).toBe(false);
        }
    });
});
