# T22 — Accessibility audit report

Branch: `fix/T22-a11y-responsive-polish`. Scope: frontend only.

## 1. Automated audit

- **axe-core gate**: `src/components/a11y/axe-gate.test.tsx` runs on every
  `vitest run` (CI `test` job). It renders the shared primitives
  (Button/Input/Textarea/Badge/FilterBar) and asserts zero violations at
  **serious**/`critical`. `color-contrast` is excluded in jsdom (no layout
  engine) — contrast is re-verified below instead.
- **Lighthouse accessibility ≥ 0.95**: added as a global LHCI assertion in
  `lighthouserc.cjs` (applies to `/`, `/dashboard`, `/projects`, `/login`).
- **Colour contrast re-verification** (token-level, computed by hand):
  - `--muted-foreground` on `--background` (both themes) ≈ 4.5:1 — body copy
    was darkened in T08 to meet AA; badges using it as text meet AA for
    normal text.
  - Status colours (`--success`, `--warning`, `--info`, `--negative`) carry
    icon + text labels, never colour alone. Disabled states use 50%
    opacity + `disabled:opacity-50` — decorative only, never the sole
    carrier of meaning.
  - Charts use pattern-accompanied fills where status is encoded (T14);
    residual risk noted, not blocking.

## 2. Keyboard

- All interactive primitives are native `<button>`/`<input>`; card-issued
  `div onClick` controls converted to `<button>` (team switcher, copy), or
  native `<label>` wrapping the real radio input (thumbnail/audio style
  presets), or `role="button"` + Enter/Space + label (trend cards/rows,
  filter chips, tone/tag badges).
- Shortcuts (`/` palette, `g` prefixes, sidebar ⌘/Ctrl) already guard with
  `isTypingTarget` — they do not fire while typing.
- `Esc` handling: Radix `Dialog`/`Sheet`/`DropdownMenu` close on `Esc`
  natively; destructive confirmations remain explicit-choice only.
- Focus: new `:focus-visible` fallback in `globals.css` (2px `--ring`
  outline) covers any control missing component rings. No `outline: none`
  without a replacement remains.
- Skip link + `id="main-content"` added to marketing and auth layouts
  (dashboard already had both via `app-shell`).

## 3. Screen readers

- Icon-only buttons: all carry `aria-label` (verified by axe gate +
  manual grep of 17 `size="icon"` buttons).
- Live regions: toasts (`role="status"`), connection banner, password
  strength meter (now `aria-live="polite"`), wizard progress, billing —
  present. Copy actions announce via the changed button text
  ("Copied"/"Sync Description").
- Landmarks: one `banner` (header), one `main`, labelled `nav`s
  (`Marketing`, `Primary`, `Breadcrumb`), one `contentinfo` (marketing
  footer). Auth now has `main`; it previously had none.
- Form errors use RHF `FormMessage` (wired to `aria-describedby` in
  `ui/form.tsx`); error summaries are in `role="alert"` regions.

## 4. Responsive

- Touch targets: `Button`/`Input`/`Textarea` primitives now enforce
  `pointer-coarse:min-h-11 min-w-11` (44 px on coarse pointers); raw
  sub-44 controls (filter-chip remove, team `h-8` button, dashboard
  `h-7`) get `max-md:h-11 max-md:w-11` per the existing header pattern.
  Desktop density unchanged.
- Form text: removed `md:text-sm` from `Input`/`Textarea` primitives —
  inputs stay 16 px (`text-base`) on all viewports; iOS no longer zooms.
- Viewport units: `min-h-[100dvh]` with `100vh` fallback on auth loading
  and global error.
- Horizontal scroll / overflow: marketing, onboarding, wizard, workspace
  and billing were visually checked at 375 px; long strings truncate
  (`truncate`/`min-w-0`) in headers and cards. Full per-width table is
  manual (390-unit client viewport) and marked as such in the PR.
- 200% zoom: layout uses relative units and truncates gracefully.

## 5. Motion

- Global `prefers-reduced-motion: reduce` rule in `globals.css` now kills
  both transitions and animations (was transitions only). Charts already
  check `matchMedia` in JS. Existing `motion-reduce:animate-none` classes
  remain (harmless duplicates).

## 6. Forms

- Every input now has a programmatic label (`htmlFor`/`id`, `aria-label`,
  or RHF `FormLabel`). Placeholder-as-label instances fixed in
  `filter-bar`, `thumbnail-generator`, `script-editor`, `seo-analyzer`,
  `hashtag-generator`.
- `autocomplete` coverage already correct (email, names, passwords).
- Submit pending states disable buttons via RHF `isSubmitting`.

## 7. Content states

Verified present via `src/components/shared/data-state.tsx` patterns:
skeleton loading, empty (icon + title + CTA), no-matches distinct message
+ clear, error + retry, offline banner (`connection-banner`), pagination
append indicator, permission/quota banners with upgrade actions,
success toasts. Route × state matrix is in the PR body (honesty: verified
by rendering routes locally, not by screenshot automation).

## 8. Polish

- No `TODO`, `lorem`, or `sk-…` values in shipped `src` (grep-verified).
- Dates/numbers use shared formatters (T14) — no new ad-hoc sites added.
- Loading buttons keep width (pending text replaces, does not relayout
  the card).

## Remaining moderate findings (justified)

- `color-contrast` not covered by the jsdom axe gate — covered by the
  token re-verification above and the Lighthouse gate (real browser).
- Viewport-width table and 200% zoom are manual verdicts, not scripted.
