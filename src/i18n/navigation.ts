import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/**
 * AR03 — the locale-aware navigation surface.
 *
 * Every internal link in the app should come from here rather than from
 * `next/link` directly: these wrappers know the routing configuration, so
 * they prefix the current locale themselves and keep the app's URLs
 * locale-less in the source (`/projects` stays `/projects` in
 * `src/lib/navigation.ts` — the prefix is a routing detail, not a data
 * detail).
 *
 * The rules that make this safe:
 *
 *   - `src/lib/navigation.ts` keeps locale-less constants. A route is a
 *     route; its label is a message, its URL is a constant. Nothing in the
 *     app concatenates a locale into a path by hand.
 *   - `redirect()` from here redirects inside the locale — a redirect that
 *     escapes to `/dashboard` from `/ar/...` would drop the visitor back
 *     into English.
 *   - `usePathname()` returns the path WITHOUT the locale prefix, so the
 *     prefix-stripping logic of the app shell keeps working unchanged.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
