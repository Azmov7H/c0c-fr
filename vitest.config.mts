import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // jsdom component tests (onboarding wizard) legitimately take ~5 s when
        // the whole suite runs in parallel; the default 5 s budget made them
        // flaky. Unit tests still finish in milliseconds.
        testTimeout: 15_000,
        include: [
            'src/app/api/auth/**/*.test.ts',
            'src/types/**/*.test.ts',
            'src/styles/**/*.test.ts',
            'src/styles/**/*.test.tsx',
            'src/middleware.test.ts',
            'src/lib/**/*.test.ts',
            'src/features/**/*.test.ts',
            'src/features/**/*.test.tsx',
            'src/store/**/*.test.tsx',
            'tests/security/**/*.test.ts',
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
            // See tests/helpers/empty-module.ts — vitest has no react-server
            // condition, so the real package would throw on import.
            'server-only': path.resolve(import.meta.dirname, 'tests/helpers/empty-module.ts'),
        },
    },
});
