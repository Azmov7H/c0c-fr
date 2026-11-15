# The RTL QA gallery

**AR-021** — the review artifact for every RTL conversion.

The gallery renders every major primitive — and the shell's own vocabulary —
in **both directions, side by side**: the same components, the same classes,
the same copy shapes, once in `en/ltr` and once in `ar/rtl`.

```
http://localhost:3000/en/qa/rtl
http://localhost:3000/ar/qa/rtl
```

## Why a page and not a screenshot

A screenshot proves one moment in one language. The gallery is a **live**
artifact: open the dropdown, open the dialog, open the sheet, hover the
tooltip — in both panes at the same time, and the difference between the panes
is the bug.

The two panes differ in **nothing but the direction and the copy**. That is
the whole contract:

- the same classes in both panes (the direction is carried by the `dir`
  attribute, never baked into the classes);
- no physical utility (`mr-`, `pl-`, `text-left`, `left-`) anywhere — the
  rendered counterpart of the `check-rtl.mjs` gate;
- the icons that must mirror carry `rtl:rotate-180`; the ones that must not
  (the media transport, the status glyphs, the search and the upload) carry
  no direction class at all.

## When it is open

The route is **closed by default**. It answers only in these two cases:

| Environment | Why |
|---|---|
| `NODE_ENV` is `development` or `test` | the developer's own machine |
| `ENABLE_QA_ROUTES=1` | the E2E stack, which runs the PRODUCTION build and still has to prove the page renders and passes axe in both directions |

Everything else — including the deployed product — gets a **404**. The flag is
read at REQUEST time (the route is `force-dynamic`), so the same build
artifact serves the gallery in the E2E job and 404s it in production: no
second artifact, and no way to enable it by accident. The route also declares
`robots: { index: false }`, so even an accidental open is not indexed.

The gate lives in `src/lib/qa-route.ts` and has its own unit test
(`src/lib/qa-route.test.ts`).

## What the machine checks about it

| Surface | What it proves |
|---|---|
| `tests/i18n/rtl-directions.test.tsx` | the markup is direction-neutral (the same classes and the same HTML in both directions), the rendered output carries no physical utility, the mirrored icons carry the mirror class and the semantic ones do not, and the progress bar fills by WIDTH (so it fills from the start in both directions) |
| `tests/e2e/specs/rtl-a11y.spec.ts` | the real thing: the document direction, the horizontal overflow and an axe-core run, per direction, on the gallery, on the public pages and on the authenticated shell |
| `scripts/check-rtl.mjs` (AR-020) | the source: no physical utility without a documented exception, and the exception list may only shrink |

## How to use it in a review

1. Open the gallery.
2. Look at the two panes **side by side**, not one after the other.
3. Anything that is not in both panes is a bug — either a class that differs
   (the markup is not direction-neutral) or a layout that breaks in one
   direction.
4. Open the interactive pieces (the menu, the dialog, the sheet, the tooltip)
   in **both** panes.
5. The Arabic pane is the one with the Arabic copy: the strings are the
   gallery's own fixtures, not the catalogs — the catalogs are English
   placeholders until the extraction batches (AR-022…AR-035) land, and a
   gallery wired to them would hide the very thing it exists to show.

## The known exceptions

`rtl-exceptions.json` lists the physical utilities that are deliberate, each
with a reason. The categories:

| Category | Example | Why |
|---|---|---|
| the placement is Radix's decision | `data-[side=left]:slide-in-from-right-2` | the overlay slides in from the side Radix placed it on |
| the side is the caller's choice | `side="right" \| "left"` (the sheet) | the shell decides which edge a drawer opens from |
| a centred element | `left-[50%] translate-x-[-50%]` | a centred element has no logical edge |
| a numeric column | `text-right tabular-nums` | the numbers read the same way in both directions |

Everything else is converted to the logical utility, and the gate fails the
build when a new one appears.
