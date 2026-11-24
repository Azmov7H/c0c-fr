import type { RenderJobStatus } from '../types';

export const TERMINAL_RENDER_STATUSES: readonly RenderJobStatus[] = [
    'completed',
    'failed',
    'cancelled',
];

export const isTerminalRenderStatus = (status?: RenderJobStatus): boolean =>
    !!status && TERMINAL_RENDER_STATUSES.includes(status);

export const isActiveRenderStatus = (status?: RenderJobStatus): boolean =>
    !!status && !isTerminalRenderStatus(status);

/** Poll fast while a job is live; stop entirely once it reaches a terminal state. */
export const renderPollIntervalMs = (status?: RenderJobStatus): number | false =>
    isTerminalRenderStatus(status) ? false : 2_000;
