import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const source = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
    root: source('src/oculus'),
    base: './',
    plugins: [svelte({ configFile: false })],
    resolve: {
        alias: {
            $lib: source('src/lib'),
            '$app/paths': source('src/oculus/shims/app-paths.ts')
        }
    },
    build: {
        outDir: source('.oculus/apps/officium'),
        emptyOutDir: true,
        modulePreload: false,
        cssCodeSplit: false,
        assetsInlineLimit: 0
    }
});
