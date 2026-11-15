/**
 * AR-021 — the physical-utility matcher.
 *
 * One matcher, two consumers:
 *
 *   - `scripts/check-rtl.mjs` — the CI gate (AR-020), which scans the SOURCE;
 *   - `tests/i18n/rtl-directions.test.tsx` — the rendered check, which scans
 *     the OUTPUT.
 *
 * Why the matcher lives here: a gate and a test that look for the same thing
 * with two different implementations are two different definitions of "the
 * same thing", and they drift.
 *
 * THE RULE
 *
 * A physical utility is a class name that CONTAINS one of the utilities at a
 * class-name boundary:
 *
 *   - the utility must start at the beginning of the token, or follow a
 *     variant marker (`:`, `-`, `[`, `]`, `/`, `&`, `*`, `>`, …). That is what
 *     makes `md:left-0`, `after:-right-4` and `[&:has([role=checkbox])]:pr-0`
 *     visible — an ARBITRARY variant still carries a physical edge;
 *   - the utility must NOT be followed by a letter: `border-r` is a physical
 *     edge, `border-ring` is a focus ring. A gate that cries wolf gets
 *     switched off, and a gate that is switched off protects nothing.
 *
 * The tokens are reported WHOLE (`group-data-[side=left]:border-r`), not as
 * the bare utility: the allowlist names the exact class, so an allowlist
 * entry is a decision about one place in the code, not about a word.
 */

/** The physical utilities, per the conversion table (RTL-DESIGN-SYSTEM §3). */
export const PHYSICAL_UTILITIES = [
    'mr-',
    'ml-',
    'pr-',
    'pl-',
    'text-left',
    'text-right',
    'border-l',
    'border-r',
    'left-',
    'right-',
];

/**
 * The characters that may precede a utility inside a class token.
 *
 * A variant marker (`:`), a negative modifier (`-`), a bracket (`[`, `]`),
 * a selector combinator (`>`, `+`, `~`, `&`, `*`), a slash (`/`), or a
 * comma. A LETTER may not — `html-` is not `ml-`.
 */
const BOUNDARY = /[:\-[\]/&*()>~+!#%@=,]/;

/** Splits a source line into the class-like tokens it carries. */
export function classTokens(line) {
    return line.split(/[\s"'`]+/).filter(Boolean);
}

/**
 * The physical utilities of one token.
 *
 * @returns the utilities found, in order of appearance (empty when the token
 *   is clean).
 */
export function utilitiesInToken(token) {
    const found = [];
    for (const utility of PHYSICAL_UTILITIES) {
        let from = 0;
        for (;;) {
            const index = token.indexOf(utility, from);
            if (index === -1) break;
            const before = index === 0 ? '' : token[index - 1];
            const after = token[index + utility.length] ?? '';
            const atBoundary = index === 0 || BOUNDARY.test(before);
            const notAWord = !/[a-zA-Z]/.test(after);
            if (atBoundary && notAWord) {
                found.push(utility);
                break;
            }
            from = index + utility.length;
        }
    }
    return found;
}

/**
 * The physical utilities of a whole text, with the line they are on.
 *
 * @returns {Array<{ utility: string, line: number }>} one entry per
 *   offending TOKEN (the token is the utility plus whatever else it carries).
 */
export function findPhysicalUtilities(text) {
    const found = [];
    const lines = text.split('\n');
    lines.forEach((line, index) => {
        for (const token of classTokens(line)) {
            if (utilitiesInToken(token).length > 0) {
                found.push({ utility: token, line: index + 1 });
            }
        }
    });
    return found;
}

/**
 * The physical utilities of a rendered class attribute.
 *
 * @returns the offending tokens.
 */
export function physicalUtilitiesInClasses(classes) {
    return classTokens(classes).filter((token) => utilitiesInToken(token).length > 0);
}
