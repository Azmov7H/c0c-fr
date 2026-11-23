'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface StepUpContextValue {
    /** Minted step-up token — memory only; nothing persisted. */
    token: string | null;
    setToken: (token: string | null) => void;
    clearToken: () => void;
}

const StepUpContext = createContext<StepUpContextValue | null>(null);

/**
 * Step-up context (spec §5.1 rule 5, `StepUpPrompt`): an admin session holds
 * a freshly minted step-up token in memory while it performs sensitive
 * mutations. The token is deliberately NOT persisted (no localStorage, no
 * cookie) — it dies with the session context and with the page.
 */
export function StepUpProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(null);
    const setToken = useCallback((next: string | null) => setTokenState(next), []);
    const clearToken = useCallback(() => setTokenState(null), []);
    const value = useCallback(
        () => ({ token, setToken, clearToken }),
        [token, setToken, clearToken],
    );
    return <StepUpContext.Provider value={value()}>{children}</StepUpContext.Provider>;
}

export function useStepUpToken(): string | null {
    const ctx = useContext(StepUpContext);
    return ctx?.token ?? null;
}

export function useSetStepUpToken(): (token: string | null) => void {
    const ctx = useContext(StepUpContext);
    return ctx?.setToken ?? (() => undefined);
}

export function useClearStepUpToken(): () => void {
    const ctx = useContext(StepUpContext);
    return ctx?.clearToken ?? (() => undefined);
}
