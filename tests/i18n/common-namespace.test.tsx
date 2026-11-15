// @vitest-environment jsdom
/**
 * AR-009 — the pipeline proof.
 *
 * The `common` namespace is the first catalog with real content. These tests
 * pin the three things the pipeline has to get right, in both languages:
 *
 *   1. the catalogs have the SAME keys (a missing Arabic key would render
 *      the English string — a silent half-translation);
 *   2. the provider hands the client components the messages of the locale
 *      they are rendered in;
 *   3. a client component reads its label from the catalog.
 */
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';

import en from '../../messages/en/common.json';
import ar from '../../messages/ar/common.json';

function keysOf(value: unknown, prefix = ''): string[] {
    if (typeof value !== 'object' || value === null) return [prefix];
    return Object.entries(value).flatMap(([key, child]) =>
        keysOf(child, prefix ? `${prefix}.${key}` : key)
    );
}

function Probe() {
    const t = useTranslations('common');
    return (
        <div>
            <span data-testid="search">{t('action.search')}</span>
            <span data-testid="skip">{t('_a11y.skipToContent')}</span>
        </div>
    );
}

describe('AR-009 the common namespace', () => {
    it('the English and the Arabic catalog have exactly the same keys', () => {
        expect(keysOf(ar).sort()).toEqual(keysOf(en).sort());
    });

    it('no value is empty in either language', () => {
        for (const [locale, catalog] of [
            ['en', en],
            ['ar', ar],
        ] as const) {
            for (const key of keysOf(catalog)) {
                const value = key
                    .split('.')
                    .reduce<unknown>(
                        (node, part) => (node as Record<string, unknown>)?.[part],
                        catalog
                    );
                expect(typeof value, `${locale}.${key} must be a string`).toBe('string');
                expect(String(value).trim(), `${locale}.${key} must not be empty`).not.toBe('');
            }
        }
    });

    it('the English UI reads its label from the catalog', () => {
        render(
            <NextIntlClientProvider locale="en" messages={{ common: en }}>
                <Probe />
            </NextIntlClientProvider>
        );
        expect(screen.getByTestId('search').textContent).toBe('Search workspace...');
        expect(screen.getByTestId('skip').textContent).toBe('Skip to content');
    });

    it('the Arabic UI reads the same label from the Arabic catalog', () => {
        render(
            <NextIntlClientProvider locale="ar" messages={{ common: ar }}>
                <Probe />
            </NextIntlClientProvider>
        );
        expect(screen.getByTestId('search').textContent).toBe('ابحث في مساحة العمل...');
        expect(screen.getByTestId('skip').textContent).toBe('تخطَّ إلى المحتوى');
    });

    it('the Arabic copy uses Arabic punctuation, not Latin', () => {
        // TRANSLATION-GUIDELINES: an Arabic sentence must not carry Latin
        // punctuation. The catalogs are the only place a stray ',' or '?' can
        // come from, so the check lives with them.
        const leaves = keysOf(ar)
            .map((key) =>
                key
                    .split('.')
                    .reduce<unknown>(
                        (node, part) => (node as Record<string, unknown>)?.[part],
                        ar
                    )
            )
            .map((value) => String(value));
        expect(leaves.length).toBeGreaterThan(0);
        for (const value of leaves) {
            expect(value, `Latin punctuation in "${value}"`).not.toMatch(/[,:;?!]/);
        }
    });
});
