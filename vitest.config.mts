import { defineConfig } from 'vitest/config';
import path from 'path';

const alias = {
    '@': path.resolve(import.meta.dirname, 'src'),
    // See tests/helpers/empty-module.ts — vitest has no react-server
    // condition, so the real package would throw on import.
    'server-only': path.resolve(import.meta.dirname, 'tests/helpers/empty-module.ts'),
};

export default defineConfig({
    test: {
        /**
         * T18: two isolated projects so node BFF tests and jsdom component
         * tests share one command without cross-contaminating environments.
         * Rule of thumb — `.test.ts` runs under node, `.test.tsx` under jsdom
         * (a component test needs the DOM; a BFF/lib test does not).
         */
        projects: [
            {
                resolve: { alias },
                test: {
                    name: 'node',
                    environment: 'node',
                    globals: true,
                    testTimeout: 15_000,
                    include: [
                        'src/app/api/**/*.test.ts',
                        'src/types/**/*.test.ts',
                        'src/lib/**/*.test.ts',
                        'src/middleware.test.ts',
                        'src/features/**/*.test.ts',
                        'tests/security/**/*.test.ts',
                    ],
                    setupFiles: ['tests/setup/node.ts'],
                },
            },
            {
                resolve: { alias },
                test: {
                    name: 'jsdom',
                    environment: 'jsdom',
                    globals: true,
                    // jsdom component tests (onboarding wizard) legitimately
                    // take ~5 s when the whole suite runs in parallel; the
                    // default 5 s budget made them flaky. Unit tests still
                    // finish in milliseconds.
                    testTimeout: 15_000,
                    include: [
                        'src/components/**/*.test.tsx',
                        'src/features/**/*.test.tsx',
                        'src/store/**/*.test.tsx',
                        'src/styles/**/*.test.tsx',
                        'src/services/**/*.test.tsx',
                        'src/hooks/**/*.test.tsx',
                    ],
                    setupFiles: ['tests/setup/component.ts'],
                },
            },
        ],
        coverage: {
            provider: 'v8',
            reportsDirectory: 'coverage',
            reporter: ['text', 'lcov', 'html'],
            include: [
                'src/app/api/**',
                'src/lib/**',
                'src/middleware.ts',
                'src/services/**',
                'src/features/**',
                'src/hooks/**',
                'src/components/shared/**',
                'src/store/**',
            ],
            exclude: [
                // Vendored shadcn/Radix wrappers — we test our own behaviour;
                // covering these would be testing Radix, not us.
                'src/components/ui/**',
                // Type-only units with no runtime branch.
                'src/features/**/types.ts',
                'src/types/**',
                '**/*.test.*',
                'src/features/**/test-fixtures.ts',
            ],
            // Gates start at what the code meets today and ratchet up in later
            // PRs (see tests/README.md). They are hard failures, not reports.
            //
            // Ratchet state (merged v8 coverage across both projects, run 7):
            //   api      card ≥90 → gates 90/90/95/90 kept (measured 100.0 on all four)
            //   lib      card ≥90 → branches/functions raised 90→98 / 90→95 (measured 99.2 / 96.0)
            //   middleware card ≥90 → 95/85/100/95 met as-is (measured 100.0 except branches 100)
            //   services card ≥90 → 90/80/100/90 met (measured 97.5/86.66/100/100)
            //   hooks    → 70/70/70/70 met (measured 97.76/81.48/94.44/100)
            //   store    → 90/75/100/90 met as-is (measured 100.0)
            //   features card ≥80 → FLOORS at measured (47.25/50.2/36.29/47.13): ratchet toward 80
            //   shared   card ≥80 → FLOORS at measured (44.11/33.33/25.0/43.75): ratchet toward 80/75/85/80
            thresholds: {
                'src/app/api/**': { statements: 90, branches: 90, functions: 95, lines: 90 },
                'src/lib/**': { statements: 98, branches: 98, functions: 95, lines: 95 },
                'src/middleware.ts': { statements: 95, branches: 85, functions: 100, lines: 95 },
                'src/services/**': { statements: 90, branches: 80, functions: 100, lines: 90 },
                'src/features/**': { statements: 47, branches: 50, functions: 36, lines: 47 },
                'src/hooks/**': { statements: 70, branches: 70, functions: 70, lines: 70 },
                'src/components/shared/**': { statements: 44, branches: 33, functions: 25, lines: 43 },
                'src/store/**': { statements: 90, branches: 75, functions: 100, lines: 90 },
            },
        },
    },
});
