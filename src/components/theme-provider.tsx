'use client';

import * as React from 'react';

/**
 * T20: in-house theme provider instead of `next-themes`.
 *
 * The app uses exactly three values (`light` | `dark` | `system`) and one
 * output (the `dark` class on `<html>`). `next-themes` ships a provider, a
 * script injector, a media-query listener and a cross-tab bridge to do that —
 * ~7.5 kB gzip on every authenticated route — while the marketing routes had
 * already replaced it with a dependency-free toggle and pre-paint script.
 * This provider closes the gap: same storage key, same class, same
 * `defaultTheme`/`enableSystem` contract, no dependency.
 *
 * Hydration contract: `theme` is `undefined` until the mount effect reads
 * storage, exactly like `next-themes`. Callers that render theme-dependent
 * markup either use the pre-paint class (icons via CSS) or gate on a mounted
 * flag, so the server and first client render agree.
 */

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

export interface ThemeProviderProps {
    children: React.ReactNode;
    /** Only `class` is supported; the app has never used the data-attribute mode. */
    attribute?: 'class';
    defaultTheme?: Theme;
    enableSystem?: boolean;
    storageKey?: string;
    disableTransitionOnChange?: boolean;
}

export interface ThemeContextValue {
    theme: Theme | undefined;
    resolvedTheme: ResolvedTheme | undefined;
    systemTheme: ResolvedTheme | undefined;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isTheme(value: unknown): value is Theme {
    return value === 'light' || value === 'dark' || value === 'system';
}

function readSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
    return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    enableSystem = true,
    storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
    const [theme, setThemeState] = React.useState<Theme | undefined>(undefined);
    const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme | undefined>(undefined);

    // Read the stored preference after mount. The pre-paint script has already
    // applied the class for the first frame, so doing this in an effect cannot
    // flash the wrong theme.
    React.useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- This is the hydration boundary, by design: the server cannot know the stored/OS theme, so the first client render deliberately matches `undefined` and this effect adopts the real value once. Reading it during render would desynchronise hydration.
        setSystemTheme(readSystemTheme());

        let stored: Theme | undefined;
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (isTheme(raw)) stored = raw;
        } catch {
            // Storage disabled: fall back to the declared default.
        }
        setThemeState(stored ?? defaultTheme);
    }, [defaultTheme, storageKey]);

    // Follow the OS preference while the choice is "system".
    React.useEffect(() => {
        if (!enableSystem || typeof window.matchMedia !== 'function') return;
        const mediaQuery = window.matchMedia(MEDIA_QUERY);
        const onChange = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
        onChange();
        mediaQuery.addEventListener('change', onChange);
        return () => mediaQuery.removeEventListener('change', onChange);
    }, [enableSystem]);

    const resolvedTheme: ResolvedTheme | undefined =
        theme === undefined ? undefined : theme === 'system' ? systemTheme : theme;

    React.useEffect(() => {
        if (resolvedTheme) applyTheme(resolvedTheme);
    }, [resolvedTheme]);

    const setTheme = React.useCallback(
        (next: Theme) => {
            setThemeState(next);
            try {
                window.localStorage.setItem(storageKey, next);
            } catch {
                // Private mode: the in-memory choice still applies for this load.
            }
            applyTheme(next === 'system' ? readSystemTheme() : next);
        },
        [storageKey]
    );

    // Keep other tabs in step with the same storage key.
    React.useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== null && event.key !== storageKey) return;
            setThemeState(isTheme(event.newValue) ? event.newValue : defaultTheme);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [defaultTheme, storageKey]);

    const value = React.useMemo<ThemeContextValue>(
        () => ({ theme, resolvedTheme, systemTheme, setTheme }),
        [theme, resolvedTheme, systemTheme, setTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const NOOP_CONTEXT: ThemeContextValue = {
    theme: undefined,
    resolvedTheme: undefined,
    systemTheme: undefined,
    setTheme: () => undefined,
};

/**
 * Safe outside the provider (a storybook-style render, an isolated unit test):
 * returns the same "not mounted yet" shape instead of throwing.
 */
export function useTheme(): ThemeContextValue {
    return React.useContext(ThemeContext) ?? NOOP_CONTEXT;
}
