import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * AR-022 / AR-023 — the hardcoded-copy scanner.
 *
 * A string that is still in the source is a string that is still English in
 * `/ar`. This scanner is the unit-level gate that says so: it reads a file
 * of a localized surface and returns every piece of English copy that is
 * still written in it. The batch tests are the ones that decide WHICH files
 * belong to a surface; this module only knows how to look.
 *
 * The shape of the search matters more than the vocabulary:
 *
 *   - a JSX text node longer than a few characters (`>Some English copy<`)
 *     is copy, including the text that FOLLOWS an expression
 *     (`{t('x')} Some English copy<`) — which is exactly where a leftover
 *     line of English survives;
 *   - the copy attributes with a literal value are copy;
 *   - the class lists are NOT copy, so they are removed first (they are the
 *     only place in the source where English words sit next to each other
 *     without being copy);
 *   - the imports, the comments and the URLs are not copy.
 *
 * The allowlist is per call: the brand and the language names are not
 * translated, and every further exception has to be named where it applies.
 */

/** Two or more Latin words of three letters or more, separated by a space. */
const LATIN_PROSE = /[A-Za-z]{3,}(?:[ ][A-Za-z]{3,})+/;

/**
 * The attributes that carry USER-FACING text. A literal in any of them is a
 * string that never reaches the catalog.
 */
const COPY_PROPS = ['title', 'alt', 'aria-label', 'placeholder', 'label', 'description'];

const REPO_ROOT = join(__dirname, '../..');

export interface HardcodedCopyOptions {
    /**
     * The strings that are not copy even though they look like it. A text
     * that CONTAINS an allowed string is allowed (the brand appears inside
     * longer sentences).
     */
    allowed?: readonly string[];
}

export function hardcodedCopy(file: string, options: HardcodedCopyOptions = {}): string[] {
    const allowed = options.allowed ?? [];
    const isAllowed = (text: string) => allowed.some((entry) => text.includes(entry));

    const source = readFileSync(join(REPO_ROOT, file), 'utf8');

    // 1. the class lists (a string or an expression) are presentation.
    const withoutClasses = source.replace(/className\s*=\s*(?:"[^"]*"|\{[^}]*\})/g, 'className=');

    // 2. the imports, the comments and the URLs are not copy.
    const withoutNoise = withoutClasses
        .replace(/import[^;]*;/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/https?:\/\/[^\s"']*/g, '');

    const found: string[] = [];

    // 3. the JSX text nodes: `>Some English copy<` — and the text that
    //    follows an EXPRESSION (`{t('x')} Some English copy<`), which is
    //    exactly where a leftover line of English tends to survive.
    //
    //    Only `.tsx` files are scanned this way: in a `.ts` file the same
    //    `>` and `<` are TypeScript generics (`Record<PlanId, …>`), not JSX.
    //    A `.ts` module that carries copy carries it as a string literal,
    //    and the batch's own data test names the fields it must not have.
    if (file.endsWith('.tsx')) {
        for (const match of withoutNoise.matchAll(/[>}]([^<>{}]{6,})</g)) {
            const text = match[1].trim();
            // A JSX text node is ONE LINE of prose. A match that spans lines
            // or carries a TypeScript operator is an arrow function or a
            // generic (`Promise<Metadata>`), not copy.
            if (text.includes('\n') || text.includes('=')) continue;
            if (LATIN_PROSE.test(text) && !isAllowed(text)) found.push(text);
        }
    }

    // 4. the copy attributes with a literal value.
    for (const prop of COPY_PROPS) {
        const pattern = new RegExp(`${prop}\\s*=\\s*"([^"]{4,})"`, 'g');
        for (const match of withoutNoise.matchAll(pattern)) {
            const text = match[1].trim();
            if (LATIN_PROSE.test(text) && !isAllowed(text)) found.push(`${prop}="${text}"`);
        }
    }

    return found;
}
