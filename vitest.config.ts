/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

// eslint-disable-next-line no-restricted-syntax
export default defineConfig({
    plugins: [tsconfigPaths()],
    clearScreen: false,
    resolve: {
        alias: {
            '~': resolve(__dirname, 'src'),
        },
    },
    test: {
        globals: true,
        reporters: 'default',
        environment: 'node',
        setupFiles: [],
        coverage: {
            reporter: ['text', 'json', 'html'],
        },
        alias: {
            '~': resolve(__dirname, 'src'),
        },
    },

});
