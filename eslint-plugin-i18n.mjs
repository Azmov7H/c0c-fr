/**
 * AR-012 — the i18n lint rules.
 *
 * Two rules, both about the same thing: the interface language must not be
 * baked into the code.
 *
 *   no-hardcoded-locale — a formatter call with a literal locale (or with
 *   the ambient default) is a second, invisible locale. FORMATTING-STRATEGY
 *   §7.3: every display format goes through `src/lib/format/`.
 *
 *   no-locale-equality — a comparison against 'en'/'ar' is usually copy
 *   that should have been a catalog key (FR-20). The legitimate cases (a
 *   direction decision, a technical switch) live in
 *   `src/i18n/exceptions.ts`.
 *
 * Both rules read their allowlist from `src/i18n/exceptions.ts` — the paths
 * listed there are exempt, everything else is not.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The allowlist file, relative to the repo root. */
const EXCEPTIONS_FILE = 'src/i18n/exceptions.ts';

/** @returns {Set<string>} the paths listed in the allowlist */
function allowedPaths(root) {
    try {
        const source = readFileSync(join(root, EXCEPTIONS_FILE), 'utf8');
        const paths = new Set();
        // The allowlist is read as text (a lint rule cannot evaluate
        // TypeScript), so the entries are the quoted paths in the file.
        for (const match of source.matchAll(/'([^']*\.[a-z]+)'/g)) {
            paths.add(match[1]);
        }
        return paths;
    } catch {
        return new Set();
    }
}

/** The repo root, derived from the file being linted. */
function repoRootOf(context) {
    const filePath = context.filename ?? context.getFilename?.() ?? '';
    const marker = `${'/'}src${'/'}`;
    const index = filePath.indexOf(marker);
    return index === -1 ? process.cwd() : filePath.slice(0, index);
}

const isLocaleLiteral = (node) =>
    node.type === 'Literal' &&
    typeof node.value === 'string' &&
    ['en', 'ar', 'en-US', 'en-GB', 'en-CA', 'ar-EG', 'ar-SA'].includes(node.value);

export const i18nPlugin = {
    rules: {
        'no-hardcoded-locale': {
            meta: {
                type: 'problem',
                docs: {
                    description:
                        'Disallow formatter calls with a hardcoded or ambient locale — the locale comes from the i18n layer',
                },
                schema: [],
                messages: {
                    intl: "Intl.{{name}} is called with the locale '{{locale}}' — the locale comes from the i18n layer (src/lib/format/)",
                    ambient:
                        'This formatter call uses the ambient locale — the locale comes from the i18n layer (src/lib/format/)',
                },
            },
            create(context) {
                const allowed = allowedPaths(repoRootOf(context));
                const relative = context.filename.replace(`${process.cwd()}/`, '');
                // The allowlist file itself is exempt: it is where the
                // legitimate comparisons live. The format layer is exempt
                // too — FORMATTING-STRATEGY §7.3: the only allowed `new
                // Intl.` sites are inside the module that owns the locale.
                if (
                    allowed.has(relative) ||
                    relative === EXCEPTIONS_FILE ||
                    relative.startsWith('src/lib/format/')
                )
                    return {};

                function report(node, messageId, data) {
                    context.report({ node, messageId, data });
                }

                return {
                    NewExpression(node) {
                        const callee = node.callee;
                        if (callee.type !== 'MemberExpression') return;
                        if (callee.object.type !== 'Identifier' || callee.object.name !== 'Intl')
                            return;
                        const [first] = node.arguments;
                        if (!first) {
                            report(node.callee, 'ambient');
                            return;
                        }
                        if (first.type === 'Literal' && typeof first.value === 'string') {
                            report(node.callee, 'intl', {
                                name: callee.property.name,
                                locale: first.value,
                            });
                        }
                    },
                    CallExpression(node) {
                        const callee = node.callee;
                        if (callee.type !== 'MemberExpression') return;
                        if (callee.property.type !== 'Identifier') return;
                        const method = callee.property.name;
                        if (!/^toLocale/.test(method)) return;
                        const [first] = node.arguments;
                        if (!first) {
                            // No locale at all: the ambient default. The
                            // calendar's `toLocaleString("default")` is the
                            // same trap with a name on it.
                            report(callee, 'ambient');
                            return;
                        }
                        if (first.type === 'Literal' && typeof first.value === 'string') {
                            report(callee, 'intl', { name: method, locale: first.value });
                        }
                    },
                };
            },
        },
        'no-locale-equality': {
            meta: {
                type: 'problem',
                docs: {
                    description:
                        "Disallow comparisons against a literal locale — copy belongs in a catalog (FR-20)",
                },
                schema: [],
                messages: {
                    comparison:
                        "This compares against the locale '{{locale}}' — copy belongs in a catalog; the legitimate cases live in src/i18n/exceptions.ts",
                },
            },
            create(context) {
                const allowed = allowedPaths(repoRootOf(context));
                const relative = context.filename.replace(`${process.cwd()}/`, '');
                // The allowlist file itself is exempt: it is where the
                // legitimate comparisons live. The format layer is exempt
                // too — FORMATTING-STRATEGY §7.3: the only allowed `new
                // Intl.` sites are inside the module that owns the locale.
                if (
                    allowed.has(relative) ||
                    relative === EXCEPTIONS_FILE ||
                    relative.startsWith('src/lib/format/')
                )
                    return {};

                const looksLikeLocale = (node) =>
                    node.type === 'Identifier' && /locale/i.test(node.name);

                return {
                    BinaryExpression(node) {
                        if (node.operator !== '===' && node.operator !== '!==') return;
                        const { left, right } = node;
                        if (isLocaleLiteral(left) && looksLikeLocale(right)) {
                            report(node, left.value);
                            return;
                        }
                        if (isLocaleLiteral(right) && looksLikeLocale(left)) {
                            report(node, right.value);
                        }
                    },
                };

                function report(node, locale) {
                    context.report({ node, messageId: 'comparison', data: { locale } });
                }
            },
        },
    },
};
