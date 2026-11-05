import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast, subscribeToToasts, type ToastItem } from './toast';

/**
 * toast is a ~1 kB event bus in front of the toaster component. These tests
 * pin the contract the websocket bridge and form components rely on: the
 * tone mapping, the auto-id counter, duration defaults and the dismiss
 * envelope.
 */
describe('toast event bus', () => {
    let seen: ToastItem[] = [];
    let unsubscribe: () => void = () => {};

    beforeEach(() => {
        // One live listener per test: every before-each first detaches the
        // previous test's listener (subscribeToToasts keeps listeners in a
        // module-level Set that outlives a test file's individual tests).
        unsubscribe();
        seen = [];
        unsubscribe = subscribeToToasts((item) => seen.push(item));
    });

    afterEach(() => {
        unsubscribe();
    });

    it('each tone verb emits its own tone with the default duration', () => {
        toast.success('saved');
        toast.error('failed');
        toast.info('heads up');
        toast.warning('careful');
        toast.message('alias');

        expect(seen.map((t) => t.tone)).toEqual([
            'success',
            'error',
            'info',
            'warning',
            'info',
        ]);
        expect(seen.every((t) => t.duration === 4000)).toBe(true);
    });

    it('auto-ids increment and a supplied id wins', () => {
        const first = toast.success('one');
        const second = toast.success('two');
        expect(first).not.toBe(second);

        const custom = toast.info('three', { id: 'op-42' });
        expect(custom).toBe('op-42');

        expect(seen.find((t) => t.id === 'op-42')?.message).toBe('three');
    });

    it('forwards optional description and duration', () => {
        toast.info('sync lost', { description: 'retrying offline changes', duration: 10_000 });

        expect(seen[0]).toMatchObject({
            description: 'retrying offline changes',
            duration: 10_000,
        });
        expect(seen[0].tone).toBe('info');
    });

    it('dismiss() broadcasts a dismissed item carrying the id', () => {
        toast.dismiss('toast-7');

        expect(seen[0]).toMatchObject({
            id: 'toast-7',
            dismissed: true,
            tone: 'info',
            duration: 0,
        });
    });

    it('dismiss() without an id carries the empty-string id the Toaster can route out', () => {
        toast.dismiss();

        expect(seen[0]).toMatchObject({ id: '', dismissed: true, duration: 0 });
    });

    it('emitting with no listeners is a safe no-op (unsubscribed toaster)', () => {
        unsubscribe();

        expect(() => toast.success('into the void')).not.toThrow();
    });

    it('the unsubscribe function removes only its own listener', () => {
        const spy = vi.fn();
        const stop = subscribeToToasts(spy);

        toast.info('both see this');

        expect(spy).toHaveBeenCalledTimes(1);
        expect(seen.some((t) => t.message === 'both see this')).toBe(true);

        stop();
        spy.mockClear();
        seen.length = 0;
        toast.info('one sided');

        expect(spy).toHaveBeenCalledTimes(0);
        expect(seen).toHaveLength(1);
    });
});
