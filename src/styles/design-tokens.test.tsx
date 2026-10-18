// @vitest-environment jsdom
//
// Why this test compiles the real stylesheet instead of asserting on a fixture:
// the defect being fixed is that `globals.css` consumed `--font-inter` and
// `--font-geist-mono`, neither of which was ever defined, so every page fell
// back to the system stack and nobody noticed. A test that only asserts the CSS
// text contains a string would pass against the broken file too. Compiling with
// the project's actual Tailwind and resolving the variable through
// `getComputedStyle` is what makes the failure mode — "silently falls back" —
// observable.
import { readFileSync } from 'node:fs';
import path from 'node:path';

import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../..');
const GLOBALS_CSS = path.join(ROOT, 'src/styles/globals.css');
const LAYOUT_TSX = path.join(ROOT, 'src/app/layout.tsx');
// T11 split the providers: the theme provider moved to AppProviders
// ((auth)/(dashboard) groups) and marketing routes get the dependency-free
// pre-paint script instead — both are asserted where they now live.
const APP_PROVIDERS_TSX = path.join(ROOT, 'src/components/app-providers.tsx');
const PRE_PAINT_TSX = path.join(ROOT, 'src/components/theme-pre-paint-script.tsx');

async function compileGlobalsCss(): Promise<string> {
    const source = readFileSync(GLOBALS_CSS, 'utf8');
    const result = await postcss([tailwindcss()]).process(source, {
        from: GLOBALS_CSS,
    });
    return result.css;
}

describe('design tokens', () => {
    let css: string;
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;

    beforeAll(async () => {
        css = await compileGlobalsCss();
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        // React 19 needs this to silence the act() warning — the render below is
        // synchronous, so a single act() is enough.
        (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        await act(async () => {
            root.render(<h1 className="font-display">Trending</h1>);
        });
    });

    afterAll(async () => {
        await act(async () => {
            root.unmount();
        });
        container.remove();
    });

    it('resolves --font-display on a rendered heading to a non-empty value', () => {
        const heading = container.querySelector('h1');
        expect(heading).not.toBeNull();

        const computed = getComputedStyle(heading as Element).getPropertyValue('--font-display');
        expect(computed.trim()).not.toBe('');
    });

    it('resolves --font-sans to a non-empty value', () => {
        const heading = container.querySelector('h1');
        const computed = getComputedStyle(heading as Element).getPropertyValue('--font-sans');
        expect(computed.trim()).not.toBe('');
    });

    it('defines the font stacks in terms of the next/font variables', () => {
        expect(css).toMatch(/--font-display:\s*var\(--font-space-grotesk\)/);
        expect(css).toMatch(/--font-sans:\s*var\(--font-body\)/);
    });

    it('contains no reference to the never-defined font variables', () => {
        expect(css).not.toContain('--font-inter');
        expect(css).not.toContain('--font-geist-mono');
    });

    it('keeps the semantic state and chart tokens defined', () => {
        for (const token of [
            '--success',
            '--warning',
            '--info',
            '--negative',
            '--chart-1',
            '--chart-5',
        ]) {
            expect(css).toContain(`${token}:`);
        }
    });
});

describe('font wiring in layout.tsx', () => {
    // The computed-style test cannot see next/font's runtime class injection, so
    // this closes the other end of the chain: the variable names the stylesheet
    // consumes must be the ones layout.tsx actually configures.
    const layout = readFileSync(LAYOUT_TSX, 'utf8');

    it('loads Inter onto --font-body', () => {
        expect(layout).toMatch(/Inter\(/);
        expect(layout).toContain("variable: '--font-body'");
    });

    it('loads Space Grotesk onto --font-space-grotesk', () => {
        expect(layout).toMatch(/Space_Grotesk\(/);
        expect(layout).toContain("variable: '--font-space-grotesk'");
    });

    it('defaults the theme to system and does not suppress the colour transition', () => {
        const appProviders = readFileSync(APP_PROVIDERS_TSX, 'utf8');
        expect(appProviders).toContain('defaultTheme="system"');
        expect(appProviders).toContain('enableSystem');
        expect(appProviders).not.toContain('disableTransitionOnChange');
    });

    it('marketing pre-paint script honours a stored preference and defaults to system', () => {
        const prePaint = readFileSync(PRE_PAINT_TSX, 'utf8');
        // Reads the same localStorage key next-themes uses…
        expect(prePaint).toContain("localStorage.getItem('theme')");
        // …and falls back to prefers-color-scheme when nothing is stored.
        expect(prePaint).toContain('prefers-color-scheme: dark');
    });
});
