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
 * The ICU arguments of a message: every identifier the message reads.
 *
 * `{name}` and `{count, plural, …}` both yield one argument. A plural's
 * CATEGORY bodies (`one {…}`, `few {…}`) are not arguments — but a group
 * INSIDE a body is:
 *
 *     "{count, plural, one {{value} item} other {{value} items}}"
 *
 * Here `count` selects the branch and `value` is what the branch displays.
 * Both are arguments, and both have to exist in every locale: a message that
 * displays `{value}` in English and forgets it in Arabic renders the
 * fallback (or throws) at runtime, and only the gate can see it.
 *
 * AR-023: the gate learned to look inside the branches when the pricing
 * catalogue started to carry a plural whose DISPLAYED number comes from the
 * app's format layer (`{value}`) while the branch is selected by a raw
 * count (`{count}`) — see AR-D-04 and the pricing copy.
 */
function placeholders(value) {
    const found = new Set();
    if (typeof value !== 'string') return found;
    collectArguments(value, found);
    return found;
}

/** Reads the balanced `{…}` group that starts at `start`. */
function readGroup(text, start) {
    let depth = 0;
    for (let index = start; index < text.length; index += 1) {
        if (text[index] === '{') depth += 1;
        else if (text[index] === '}') {
            depth -= 1;
            if (depth === 0) {
                return { content: text.slice(start + 1, index), end: index + 1 };
            }
        }
    }
    return { content: text.slice(start + 1), end: text.length };
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Collects the arguments of every group in `text` into `found`. */
function collectArguments(text, found) {
    let index = 0;
    while (index < text.length) {
        if (text[index] !== '{') {
            index += 1;
            continue;
        }
        const { content, end } = readGroup(text, index);
        index = end;

        const firstComma = content.indexOf(',');
        if (firstComma === -1) {
            const name = content.trim();
            if (IDENTIFIER.test(name)) found.add(name);
            // A plural CATEGORY body has no comma and is not an identifier:
            // its braces are a body, not an argument — look inside it.
            else collectArguments(content, found);
            continue;
        }

        const name = content.slice(0, firstComma).trim();
        if (IDENTIFIER.test(name)) found.add(name);

        const rest = content.slice(firstComma + 1);
        const secondComma = rest.indexOf(',');
        const type = (secondComma === -1 ? rest : rest.slice(0, secondComma)).trim();
        if (type === 'plural' || type === 'selectordinal' || type === 'select') {
            // The categories are `one {…}`, `two {…}`, …; walk into every
            // body, because a body can display other arguments.
            const body = secondComma === -1 ? '' : rest.slice(secondComma + 1);
            collectArguments(body, found);
        }
    }
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
