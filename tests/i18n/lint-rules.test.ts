import { describe } from 'vitest';
import { RuleTester } from 'eslint';

// The plugin is plain ESM JavaScript next to the config (ESLint loads the
// config as JavaScript); the rule objects are therefore untyped here.
import { i18nPlugin } from '../../eslint-plugin-i18n.mjs';

/**
 * AR-012 — the i18n lint rules have to FAIL when they should.
 *
 * A lint rule that cannot fail is a comment, and a rule that fires on
 * everything is noise. These cases pin both halves: the honest call is left
 * alone, the hardcoded locale and the locale comparison are reported.
 */
const ruleTester = new RuleTester({
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const rules = (i18nPlugin as unknown as { rules: Record<string, unknown> }).rules;

describe('AR-012 the i18n lint rules', () => {
    ruleTester.run('no-hardcoded-locale', rules['no-hardcoded-locale'] as never, {
        valid: [
            // The locale comes from the i18n layer — the honest call.
            { code: "const format = new Intl.DateTimeFormat(locale, { month: 'long' });" },
            { code: 'const format = getFormatter(locale);' },
        ],
        invalid: [
            {
                code: "const format = new Intl.DateTimeFormat('en-US', { month: 'long' });",
                errors: [{ messageId: 'intl' }],
            },
            {
                code: "const format = new Intl.RelativeTimeFormat('en-US');",
                errors: [{ messageId: 'intl' }],
            },
            {
                code: 'const text = date.toLocaleDateString();',
                errors: [{ messageId: 'ambient' }],
            },
            {
                // No locale at all: the ambient default is a second,
                // invisible locale.
                code: 'const format = new Intl.NumberFormat();',
                errors: [{ messageId: 'ambient' }],
            },
            {
                code: 'const text = value.toLocaleString("default");',
                errors: [{ messageId: 'intl' }],
            },
        ],
    });

    ruleTester.run('no-locale-equality', rules['no-locale-equality'] as never, {
        valid: [
            // A comparison that is not about a locale is none of the rule's
            // business.
            { code: "const active = status === 'active';" },
            { code: "const on = feature === 'on';" },
        ],
        invalid: [
            {
                code: "const label = locale === 'ar' ? 'Arabic' : 'English';",
                errors: [{ messageId: 'comparison' }],
            },
            {
                code: "const other = locale !== 'en';",
                errors: [{ messageId: 'comparison' }],
            },
            {
                code: "const dir = activeLocale === 'ar' ? 'rtl' : 'ltr';",
                errors: [{ messageId: 'comparison' }],
            },
        ],
    });
});
