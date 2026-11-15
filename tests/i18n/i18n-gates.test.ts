import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * AR-011 — the gates have to FAIL when they should.
 *
 * A gate that cannot fail is a comment. These tests seed the violations the
 * gates exist to catch — a missing Arabic key, a dropped ICU argument, a
 * reference to a key that does not exist, a key nobody uses — and assert
 * that each script names it and exits non-zero.
 */

const ROOT = process.cwd();

function run(script: string, cwd: string): { status: number; output: string } {
    try {
        const output = execFileSync('node', [join(ROOT, 'scripts/i18n', script)], {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        return { status: 0, output };
    } catch (error) {
        const failure = error as { status?: number; stdout?: string; stderr?: string };
        return {
            status: failure.status ?? 1,
            output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`,
        };
    }
}

/** A throwaway tree with `messages/{en,ar}` and `src/`. */
function scaffold(catalogs: Record<string, Record<string, unknown>>): string {
    const root = mkdtempSync(join(tmpdir(), 'i18n-gate-'));
    mkdirSync(join(root, 'messages', 'en'), { recursive: true });
    mkdirSync(join(root, 'messages', 'ar'), { recursive: true });
    mkdirSync(join(root, 'src'), { recursive: true });
    for (const [locale, namespaces] of Object.entries(catalogs)) {
        for (const [namespace, content] of Object.entries(namespaces)) {
            writeFileSync(
                join(root, 'messages', locale, `${namespace}.json`),
                JSON.stringify(content, null, 2)
            );
        }
    }
    return root;
}

describe('AR-011 the catalog parity gate', () => {
    it('passes when the catalogs agree', () => {
        const root = scaffold({
            en: { common: { action: { save: 'Save' } } },
            ar: { common: { action: { save: 'حفظ' } } },
        });
        try {
            const result = run('check-parity.mjs', root);
            expect(result.status).toBe(0);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('fails when a key is missing in Arabic', () => {
        const root = scaffold({
            en: { common: { action: { save: 'Save', cancel: 'Cancel' } } },
            ar: { common: { action: { save: 'حفظ' } } },
        });
        try {
            const result = run('check-parity.mjs', root);
            expect(result.status).toBe(1);
            expect(result.output).toContain('cancel');
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('fails when an ICU argument is dropped in Arabic', () => {
        const root = scaffold({
            en: { common: { invite: '{inviter} invited you to {project}.' } },
            ar: { common: { invite: 'دعاك {inviter} إلى المشروع.' } },
        });
        try {
            const result = run('check-parity.mjs', root);
            expect(result.status).toBe(1);
            expect(result.output).toContain('{project}');
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('fails when a namespace exists in one language only', () => {
        const root = scaffold({
            en: { common: {}, landing: {} },
            ar: { common: {} },
        });
        try {
            const result = run('check-parity.mjs', root);
            expect(result.status).toBe(1);
            expect(result.output).toContain('landing');
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('AR-011 the key-usage gate', () => {
    it('passes when every reference resolves', () => {
        const root = scaffold({
            en: { common: { action: { save: 'Save' } } },
            ar: { common: { action: { save: 'حفظ' } } },
        });
        writeFileSync(
            join(root, 'src', 'example.tsx'),
            `const t = useTranslations('common');\nexport const label = t('action.save');\n`
        );
        try {
            const result = run('extract-usage.mjs', root);
            expect(result.status).toBe(0);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('fails when a component references a key that does not exist', () => {
        const root = scaffold({
            en: { common: { action: { save: 'Save' } } },
            ar: { common: { action: { save: 'حفظ' } } },
        });
        writeFileSync(
            join(root, 'src', 'example.tsx'),
            `const t = useTranslations('common');\nexport const label = t('acton.save');\n`
        );
        try {
            const result = run('extract-usage.mjs', root);
            expect(result.status).toBe(1);
            expect(result.output).toContain('acton.save');
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('fails when a catalog key is never used', () => {
        const root = scaffold({
            en: { common: { action: { save: 'Save', cancel: 'Cancel' } } },
            ar: { common: { action: { save: 'حفظ', cancel: 'إلغاء' } } },
        });
        writeFileSync(
            join(root, 'src', 'example.tsx'),
            `const t = useTranslations('common');\nexport const label = t('action.save');\n`
        );
        try {
            const result = run('extract-usage.mjs', root);
            expect(result.status).toBe(1);
            expect(result.output).toContain('cancel');
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('accepts a key that is explicitly marked unused', () => {
        const root = scaffold({
            en: { common: { action: { save: 'Save', cancel: 'Cancel' }, '@unused': ['action.cancel'] } },
            ar: { common: { action: { save: 'حفظ', cancel: 'إلغاء' } } },
        });
        writeFileSync(
            join(root, 'src', 'example.tsx'),
            `const t = useTranslations('common');\nexport const label = t('action.save');\n`
        );
        try {
            const result = run('extract-usage.mjs', root);
            expect(result.status).toBe(0);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
