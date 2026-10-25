// @vitest-environment jsdom
/** T18 P2: useIsMobile is a useSyncExternalStore over matchMedia; jsdom has no
 *  layout engine so the media query must be faked at the boundary. What the
 *  test buys you is the subscription contract: components re-render when the
 *  query flips, teardown unsubscribes, and SSR's server snapshot is "desktop".
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

interface FakeMql extends EventTarget {
    matches: boolean;
    dispatchChange: () => void;
}

const fakes: FakeMql[] = [];

function installMatchMedia() {
    const mql = new EventTarget() as FakeMql & {
        matches: boolean;
        dispatchChange: () => void;
    };
    let matches = false;
    Object.defineProperty(mql, 'matches', {
        get: () => matches,
        set: (v: boolean) => {
            matches = v;
        },
    });
    mql.dispatchChange = () => {
        act(() => {
            mql.dispatchEvent(new Event('change'));
        });
    };
    fakes.push(mql);
    vi.stubGlobal('matchMedia', () => mql);
    // The hook reads window.matchMedia, not the bare global:
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: vi.fn(() => mql),
    });
    return mql;
}

afterEach(() => {
    vi.unstubAllGlobals();
    fakes.length = 0;
    cleanup();
});

describe('useIsMobile', () => {
    it('starts desktop when the query does not match', () => {
        installMatchMedia();
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });

    it('flips to mobile and back when the query changes while subscribed', () => {
        const mql = installMatchMedia();
        const { result } = renderHook(() => useIsMobile());

        mql.matches = true;
        mql.dispatchChange();
        expect(result.current).toBe(true);

        mql.matches = false;
        mql.dispatchChange();
        expect(result.current).toBe(false);
    });

    it('removes the change listener on unmount (no leak across remounts)', () => {
        const mql = installMatchMedia();
        const removeSpy = vi.spyOn(mql, 'removeEventListener');

        const { unmount } = renderHook(() => useIsMobile());
        unmount();

        expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('a jsdom without matchMedia still renders desktop (component setup polyfills it)', () => {
        // No installMatchMedia here — the component.ts setup polyfill stands in.
        // It returns matches:false for every query, which is the SSR contract.
        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(false);
    });
});
