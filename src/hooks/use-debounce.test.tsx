// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the initial value immediately (no delay on mount)', () => {
        const { result } = renderHook(() => useDebounce('a', 300));
        expect(result.current).toBe('a');
    });

    it('only exposes the new value after the delay elapses', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
            initialProps: { value: 'a' },
        });

        rerender({ value: 'b' });
        expect(result.current).toBe('a');

        act(() => {
            vi.advanceTimersByTime(299);
        });
        expect(result.current).toBe('a');

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe('b');
    });

    it('a value overwritten mid-window replaces the pending timeout (no burst of old values)', () => {
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
            initialProps: { value: 'a' },
        });

        rerender({ value: 'b' });
        act(() => {
            vi.advanceTimersByTime(50);
        });
        rerender({ value: 'c' });
        act(() => {
            vi.advanceTimersByTime(100);
        });
        // 'b' was superseded before its 100ms fired; only 'c' is observable.
        expect(result.current).toBe('c');
    });
});
