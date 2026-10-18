import { describe, expect, it } from 'vitest';

import { safeCallbackUrl } from './callback-url';

describe('safeCallbackUrl', () => {
    it('keeps ordinary same-origin paths, including query and hash', () => {
        for (const target of ['/', '/dashboard', '/settings?tab=security', '/a/b#c']) {
            expect(safeCallbackUrl(target)).toBe(target);
        }
    });

    it('rejects protocol-relative and backslash-smuggled targets', () => {
        // Both of these become absolute URLs in router.push / new URL — the
        // classic open-redirect the old startsWith('/') check allowed.
        expect(safeCallbackUrl('//evil.com')).toBeNull();
        expect(safeCallbackUrl('/\\evil.com')).toBeNull();
    });

    it('rejects absolute and scheme URLs', () => {
        for (const target of ['https://evil.com', 'http://evil.com/x', 'javascript:alert(1)']) {
            expect(safeCallbackUrl(target)).toBeNull();
        }
    });

    it('treats empty and missing values as no target', () => {
        for (const target of [null, undefined, '']) {
            expect(safeCallbackUrl(target)).toBeNull();
        }
    });
});
