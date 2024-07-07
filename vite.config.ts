/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import biomePlugin from 'vite-plugin-biome';
import tsconfigPaths from 'vite-tsconfig-paths';

// eslint-disable-next-line no-restricted-syntax
export default defineConfig(({mode}) => {
    return ({
        clearScreen: false,
        resolve: {
            alias: {
                '~': resolve(__dirname, 'src'),
            },
        },
        plugins: [
            // @ts-ignore
            mode === 'test' ? undefined : biomePlugin(),
            tsconfigPaths()
        ],
        //todo(dawiidio): move build from tsc to vite
        build: {
            target: 'node22',
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                name: 'pli',
                formats: ['cjs']
            },
            outDir: 'lib',
            rollupOptions: {
                external: (id) => !id.startsWith('.') && !id.startsWith('/'), // Externalize all non-relative modules
                output: {
                    format: 'cjs', // Use 'es' for ES Modules
                },
            }
        },
        test: {
            exclude: ['examples/**/*', 'templates/**/*', 'test', 'node_modules', 'lib'],
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
    })
});
