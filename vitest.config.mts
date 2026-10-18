import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: [
            'src/app/api/auth/**/*.test.ts',
            'src/types/**/*.test.ts',
            'src/styles/**/*.test.ts',
            'src/styles/**/*.test.tsx',
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'src'),
        },
    },
});
