import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { GET, HEAD } from '@/app/(auth)/register/route';
import robots from '@/app/robots';
import { metadata } from '@/app/(auth)/layout';

/**
 * T12: `/register` becomes a permanent redirect to the canonical `/signup`,
 * and every auth-flow page is excluded from indexing — both by robots.txt
 * (path rules) and by the layout's robots meta (the meta is what can remove
 * an already-indexed URL; a robots.txt entry only prevents future crawls).
 */

describe('/register 301 redirect', () => {
    const request = new NextRequest('http://localhost/register');

    it('GET answers 301 with an absolute /signup location', () => {
        const res = GET(request);
        expect(res.status).toBe(301);
        expect(res.headers.get('location')).toBe('http://localhost/signup');
    });

    it('HEAD behaves identically', () => {
        const res = HEAD(request);
        expect(res.status).toBe(301);
        expect(res.headers.get('location')).toBe('http://localhost/signup');
    });
});

describe('auth pages are not indexed', () => {
    const AUTH_PATHS = [
        '/login',
        '/signup',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
    ];

    it('robots.txt disallows every auth-flow path', () => {
        const { rules } = robots();
        const disallow = Array.isArray(rules) ? rules.flatMap((r) => r.disallow ?? []) : rules.disallow ?? [];
        for (const path of AUTH_PATHS) {
            expect(disallow).toContain(path);
        }
    });

    it('the (auth) layout emits a noindex/nofollow robots meta', () => {
        expect(metadata.robots).toEqual({ index: false, follow: false });
    });
});
