/**
 * Dependency-free light/dark toggle for the marketing header.
 *
 * T20 made this a server component. As a client component it cost its own
 * first-load chunk (~0.7 kB gzip) plus the client boundary runtime on the one
 * route with the tightest budget. The button renders identically on the
 * server; one delegated inline script (part of the prerendered HTML) attaches
 * the click behaviour. That is the same trade the pre-paint theme script
 * already makes, and it keeps the marketing route's JavaScript to framework
 * + `next/image` only.
 *
 * It writes the same `theme` localStorage key and `dark` class that the app
 * theme provider uses (see theme-pre-paint-script.tsx for the pre-paint half),
 * so the choice carries over both ways.
 *
 * Both icons occupy the same grid cell and CSS decides which one shows, so the
 * toggle is correct before the script runs and without JavaScript.
 */
const SCRIPT = `(function(){var b=document.getElementById('theme-quick-toggle');if(!b)return;b.addEventListener('click',function(){try{var e=document.documentElement;var d=!e.classList.contains('dark');e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';localStorage.setItem('theme',d?'dark':'light');}catch(e){}});})();`;

export function ThemeQuickToggle() {
    return (
        <>
            <button
                id="theme-quick-toggle"
                type="button"
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
            <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
        </>
    );
}
