/**
 * Pre-paint theme script for the marketing routes.
 *
 * The marketing pages do not mount the app theme provider (T11 bundle
 * budget: its runtime cost ~12 kB gz on the one route that must stay under
 * 140 kB). This inline script does the one thing that is actually
 * needed before first paint: apply the stored theme class to <html> so a
 * dark-mode visitor never sees a white flash. It reads and writes the same
 * `theme` localStorage key (`light` | `dark` | `system`, absent = system)
 * that the app theme provider uses, so the two stay consistent.
 *
 * The script is part of the prerendered HTML, so it runs before paint on
 * every load. Under the report-only CSP it is a reportable inline script
 * (nonce-less static pages); the enforce-phase decision for static routes
 * (documented in T09-STATUS) covers it.
 *
 * T21 review fix: the same script also installs ONE delegated document
 * click listener for #theme-quick-toggle. The old per-button inline script
 * inside ThemeQuickToggle never executed on client-side navigation (React
 * inserts <script> nodes dynamically and browsers do not run them), so the
 * toggle was dead after an SPA navigation. Delegating on `document`
 * survives navigation because the listener lives on the document, not on
 * the button node React re-creates on each route change. This keeps the
 * toggle a zero-JS server component for the tight landing budget.
 */
const SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}document.addEventListener('click',function(ev){try{var b=ev.target&&ev.target.closest&&ev.target.closest('#theme-quick-toggle');if(!b)return;var e=document.documentElement;var d=!e.classList.contains('dark');e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';localStorage.setItem('theme',d?'dark':'light');}catch(x){}});})();`;

export function ThemePrePaintScript() {
    return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
