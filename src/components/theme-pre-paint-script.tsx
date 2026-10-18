/**
 * Pre-paint theme script for the marketing routes.
 *
 * The marketing pages no longer mount next-themes (T11 bundle budget: the
 * provider + its client runtime cost ~12 kB gz on the one route that must
 * stay under 140 kB). This inline script does the one thing that is actually
 * needed before first paint: apply the stored theme class to <html> so a
 * dark-mode visitor never sees a white flash. It reads and writes the same
 * `theme` localStorage key (`light` | `dark` | `system`, absent = system)
 * that next-themes uses inside the app, so the two stay consistent.
 *
 * The script is part of the prerendered HTML, so it runs before paint on
 * every load. Under the report-only CSP it is a reportable inline script
 * (nonce-less static pages); the enforce-phase decision for static routes
 * (documented in T09-STATUS) covers it.
 */
const SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export function ThemePrePaintScript() {
    return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
