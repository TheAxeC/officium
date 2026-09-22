import js from '@eslint/js';
import globals from 'globals';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            '.svelte-kit/',
            'build/',
            'node_modules/',
            'playwright-report/',
            'rituals/',
            'src-tauri/target/',
            'tmp/'
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...svelte.configs.recommended,
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node }
        },
        rules: {
            'no-var': 'error',
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
        }
    },
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser
            }
        }
    },
    {
        files: ['src/lib/views/SourceLink.svelte'],
        rules: {
            'svelte/no-navigation-without-resolve': 'off'
        }
    }
);
