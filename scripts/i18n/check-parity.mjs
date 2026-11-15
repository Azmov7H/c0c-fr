#!/usr/bin/env node
/**
 * AR-011 — the catalog parity gate.
 *
 * Two rules, both fatal:
 *
 *   1. KEY PARITY — every key in the English catalog exists in the Arabic
 *      one. A missing Arabic key renders the English string at runtime: a
 *      silent half-translation, which is worse than an obvious gap.
 *   2. PLACEHOLDER PARITY — the ICU arguments of a key are the same in both
 *      languages. A dropped `{inviter}` breaks the interpolation in Arabic
 *      only, and a dropped `{count}` breaks the plural form.
 *
 * The catalogs are found on disk (`messages/<locale>/<namespace>.json`); the
 * locales are the directories next to them, so a new locale is picked up
 * automatically.
 *
 * Usage: node scripts/i18n/check-parity.mjs
 * Exit:  0 when the catalogs agree, 1 with every violation named.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const MESSAGES_DIR = join(ROOT, 'messages');
const ROOT_LOCALE = 'en';

/** @returns {string[]} the locale directories */
function locales() {
    return readdirSync(MESSAGES_DIR)
        .filter((entry) => statSync(join(MESSAGES_DIR, entry)).isDirectory())
        .sort();
}

/** @returns {string[]} the namespace files of one locale */
function namespaces(locale) {
    return readdirSync(join(MESSAGES_DIR, locale))
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace(/\.json$/, ''))
        .sort();
}

function readCatalog(locale, namespace) {
    const file = join(MESSAGES_DIR, locale, `${namespace}.json`);
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
        throw new Error(`${relative(ROOT, file)} is not valid JSON: ${error.message}`);
    }
}

/**
 * Flattens a catalog into `{ 'a.b.c': 'value' }`.
 *
 * The keys are dotted paths, because that is how they are written in the
 * code: `t('action.save')` reads `catalog.action.save`.
 */
function flatten(value, prefix = '') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return { [prefix]: value };
    }
    const out = {};
    for (const [key, child] of Object.entries(value)) {
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

/**
 * The ICU arguments of a message: the identifiers of the top-level `{…}`
 * groups. `{name}` and `{count, plural, …}` both yield one argument; the
 * nested `{one {…} other {…}}` branches do not.
 */
function placeholders(value) {
    const found = new Set();
    if (typeof value !== 'string') return found;
    let depth = 0;
    let current = '';
    for (const character of value) {
        if (character === '{') {
            depth += 1;
            if (depth === 1) {
                current = '';
                continue;
            }
        }
        if (character === '}') {
            depth -= 1;
            if (depth === 0) {
                const name = current.split(',')[0].trim();
                if (name) found.add(name);
                continue;
            }
        }
        if (depth === 1) current += character;
    }
    return found;
}

const problems = [];
const allLocales = locales();

if (!allLocales.includes(ROOT_LOCALE)) {
    console.error(`✗ the root locale "${ROOT_LOCALE}" has no catalog directory`);
    process.exit(1);
}

for (const locale of allLocales) {
    if (locale === ROOT_LOCALE) continue;

    const rootNamespaces = namespaces(ROOT_LOCALE);
    const localeNamespaces = namespaces(locale);

    for (const namespace of rootNamespaces) {
        if (!localeNamespaces.includes(namespace)) {
            problems.push(`namespace "${namespace}" has no ${locale} catalog`);
            continue;
        }
    }
    for (const namespace of localeNamespaces) {
        if (!rootNamespaces.includes(namespace)) {
            problems.push(`namespace "${namespace}" exists only in ${locale}`);
        }
    }

    for (const namespace of rootNamespaces) {
        if (!localeNamespaces.includes(namespace)) continue;

        const root = flatten(readCatalog(ROOT_LOCALE, namespace));
        const target = flatten(readCatalog(locale, namespace));

        for (const [key, value] of Object.entries(root)) {
            if (!(key in target)) {
                problems.push(`${locale}/${namespace}.${key} is missing (en has it)`);
                continue;
            }
            const rootArguments = placeholders(value);
            const targetArguments = placeholders(target[key]);
            for (const argument of rootArguments) {
                if (!targetArguments.has(argument)) {
                    problems.push(
                        `${locale}/${namespace}.${key} is missing the argument {${argument}}`
                    );
                }
            }
            for (const argument of targetArguments) {
                if (!rootArguments.has(argument)) {
                    problems.push(
                        `${locale}/${namespace}.${key} has the extra argument {${argument}}`
                    );
                }
            }
            if (
                typeof value === 'string' &&
                value.trim() === '' &&
                typeof target[key] === 'string' &&
                target[key].trim() === ''
            ) {
                problems.push(`${locale}/${namespace}.${key} is empty in both languages`);
            }
        }

        for (const key of Object.keys(target)) {
            if (!(key in root)) {
                problems.push(`${locale}/${namespace}.${key} has no ${ROOT_LOCALE} counterpart`);
            }
        }
    }
}

if (problems.length > 0) {
    console.error(`\n✗ i18n parity: ${problems.length} problem(s)\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error(
        '\nEvery key in en must exist in every other locale with the same ICU arguments.\n'
    );
    process.exit(1);
}

console.log(
    `✓ i18n parity: ${allLocales.length} locale(s) × ${namespaces(ROOT_LOCALE).length} namespace(s) agree`
);
