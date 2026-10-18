'use client';

import * as React from 'react';

/**
 * Dependency-free light/dark toggle for the marketing header.
 *
 * Deliberately not next-themes: importing the provider or its hooks into the
 * landing route pulled the theme runtime into the budget (T11). This writes
 * the same `theme` localStorage key and `dark` class that next-themes uses
 * inside the app (see theme-pre-paint-script.tsx for the pre-paint half), so
 * the choice carries over both ways.
 *
 * Hydration-safe: both icons occupy the same grid cell and CSS decides which
 * one shows, so server and client always render the same markup.
 */
export function ThemeQuickToggle() {
    const toggle = () => {
        const el = document.documentElement;
        const isDark = el.classList.contains('dark');
        const next = isDark ? 'light' : 'dark';
        el.classList.toggle('dark', !isDark);
        el.style.colorScheme = next;
        try {
            localStorage.setItem('theme', next);
        } catch {
            // Private mode with storage disabled: the class still applies for
            // this page view; nothing else depends on the write succeeding.
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label="Toggle color theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <span aria-hidden className="grid">
                <svg
                    className="col-start-1 row-start-1 hidden h-4 w-4 dark:block"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
                <svg
                    className="col-start-1 row-start-1 h-4 w-4 dark:hidden"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </span>
        </button>
    );
}
