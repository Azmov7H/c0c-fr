#!/usr/bin/env node
/**
 * AR-011 — the key-usage gate.
 *
 * Two directions, and both matter:
 *
 *   1. EVERY REFERENCED KEY MUST EXIST in the English catalog. A typo in
 *      `t('acton.save')` is a runtime error in the page, not a build error;
 *      here it is a build error.
 *   2. EVERY CATALOG KEY MUST BE USED, or explicitly marked. A key nobody
 *      reads is a translation nobody paid for and nobody can see — and it is
 *      usually the residue of a rename.
 *
 * The scanner reads the translator bindings (`const t = useTranslations('ns')`)
 * and the key calls that go with them (`t('action.save')`). Keys that are
 * built at runtime (`t(\`card.${status}.title\`)`) cannot be checked
 * statically; they are reported as UNCHECKED, and the catalog key they point
 * at has to be marked `@unused` (or listed in the namespace's `@dynamic` list)
 * so the dead-key rule does not fire on it.
 *
 * Usage: node scripts/i18n/extract-usage.mjs
 * Exit:  0 when every reference resolves, 1 with every violation named.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.argv[2] ?? process.cwd();
const SRC_DIR = join(ROOT, 'src');
const MESSAGES_DIR = join(ROOT, 'messages');
const ROOT_LOCALE = 'en';

/** Every source file under `src`. */
function sourceFiles(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
        else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.d.ts')) out.push(full);
    }
    return out;
}

function readCatalog(locale, namespace) {
    try {
        return JSON.parse(readFileSync(join(MESSAGES_DIR, locale, `${namespace}.json`), 'utf8'));
    } catch {
        return {};
    }
}

function flatten(value, prefix = '') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return { [prefix]: value };
    }
    const out = {};
    for (const [key, child] of Object.entries(value)) {
        if (prefix === '' && key.startsWith('@')) continue; // @unused / @dynamic
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

function namespaces(locale) {
    try {
        return readdirSync(join(MESSAGES_DIR, locale))
            .filter((file) => file.endsWith('.json'))
            .map((file) => file.replace(/\.json$/, ''));
    } catch {
        return [];
    }
}

/**
 * The translator bindings of a file: `t` → the namespace it reads.
 *
 *   const t = useTranslations('common')
 *   const t = await getTranslations('common')
 *   const t = await getTranslations({ namespace: 'common' })
 *
 * AR-023: a translator can also arrive as a PARAMETER. The pricing copy is
 * read through one seam (`buildPricingCopy(t)`) that the server-rendered
 * marketing page and the client-rendered app surfaces share, and the seam
 * never calls a hook itself. The namespace is still statically known,
 * because the translator's TYPE carries it:
 *
 *   type PricingTranslator = ReturnType<typeof useTranslations<'pricing'>>
 *   function buildPricingCopy(t: PricingTranslator) { … }
 *
 * So the type aliases in a file are read first, and every parameter or
 * object field typed as one of them becomes a binding. A key inside the seam
 * is checked exactly like a key inside a component.
 */
function translatorBindings(source) {
    const bindings = new Map();

    const direct =
        /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:\{[^}]*namespace\s*:\s*)?['"]([^'"]+)['"]/g;
    for (const match of source.matchAll(direct)) {
        bindings.set(match[1], match[2]);
    }

    const aliases = new Map();
    const aliasPattern =
        /type\s+([A-Za-z_$][\w$]*)\s*=\s*ReturnType\s*<\s*typeof\s+useTranslations\s*<\s*['"]([^'"]+)['"]\s*>\s*>/g;
    for (const match of source.matchAll(aliasPattern)) {
        aliases.set(match[1], match[2]);
    }

    for (const [typeName, namespace] of aliases) {
        const typed = new RegExp(`([A-Za-z_$][\\w$]*)\\s*:\\s*${typeName}\\b`, 'g');
        for (const match of source.matchAll(typed)) {
            bindings.set(match[1], namespace);
        }
    }

    return bindings;
}

/** The keys a translator is called with: `t('a.b')`, `t.rich('a.b')`, … */
function keyCalls(source, variable) {
    const keys = [];
    const dynamic = [];
    const pattern = new RegExp(
        `\\b${variable}(?:\\.rich|\\.has|\\.raw)?\\s*\\(\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`,
        'g'
    );
    for (const match of source.matchAll(pattern)) {
        const key = match[2];
        if (key.includes('${')) dynamic.push(key);
        else keys.push(key);
    }
    return { keys, dynamic };
}

const problems = [];
const warnings = [];
const usage = new Map(); // namespace → Set of used keys
const dynamicCalls = [];

for (const file of sourceFiles(SRC_DIR)) {
    const source = readFileSync(file, 'utf8');
    const bindings = translatorBindings(source);

    for (const [variable, namespace] of bindings) {
        const { keys, dynamic } = keyCalls(source, variable);
        const catalog = flatten(readCatalog(ROOT_LOCALE, namespace));

        for (const key of keys) {
            if (!(key in catalog)) {
                problems.push(
                    `${relative(ROOT, file)}: t('${key}') is not in the "${namespace}" catalog`
                );
            }
            if (!usage.has(namespace)) usage.set(namespace, new Set());
            usage.get(namespace).add(key);
        }
        for (const key of dynamic) {
            dynamicCalls.push({ file: relative(ROOT, file), namespace, key });
        }
    }
}

// The dead-key rule: every key in the English catalog is used or marked.
for (const namespace of namespaces(ROOT_LOCALE)) {
    const raw = readCatalog(ROOT_LOCALE, namespace);
    const marked = new Set(raw['@unused'] ?? []);
    const dynamicMarked = new Set(raw['@dynamic'] ?? []);
    const catalog = flatten(raw);
    const used = usage.get(namespace) ?? new Set();

    for (const key of Object.keys(catalog)) {
        if (used.has(key) || marked.has(key)) continue;
        if (dynamicMarked.has(key)) {
            warnings.push(
                `${namespace}.${key} is only reachable through a dynamic key — list it under "@dynamic"`
            );
            continue;
        }
        problems.push(
            `${namespace}.${key} is in the catalog but never used — reference it or mark it "@unused"`
        );
    }
}

for (const call of dynamicCalls) {
    warnings.push(
        `${call.file}: a dynamic key is built for "${call.namespace}" (${call.key}) — it cannot be checked`
    );
}

if (problems.length > 0) {
    console.error(`\n✗ i18n usage: ${problems.length} problem(s)\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error('');
    process.exit(1);
}

console.log(`✓ i18n usage: every referenced key exists and every catalog key is used`);
if (warnings.length > 0) {
    console.log(`  (${warnings.length} note(s))`);
    for (const warning of warnings) console.log(`  · ${warning}`);
}
