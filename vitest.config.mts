import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        // environment stays 'node' until T18 adds jsdom. Tests that need a DOM
        // belong in the jsdom project introduced there, not here.
        include: [
            'src/app/api/auth/**/*.test.ts',
            'src/types/**/*.test.ts',
            'tests/**/*.test.ts',
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
        },
    },
});
