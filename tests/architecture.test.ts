import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('source architecture', () => {
    it('keeps imports within the accepted layer direction', () => {
        const violations: string[] = [];
        for (const file of sourceFiles(join(root, 'src/lib'))) {
            const path = relative(root, file);
            const source = readFileSync(file, 'utf8');
            if (path.startsWith('src/lib/data/')) {
                if (/\$lib\/(reader|views|server)\//.test(source) || /\.svelte['"]/.test(source)) {
                    violations.push(path);
                }
            }
            if (path.startsWith('src/lib/reader/')) {
                if (/\$lib\/(views|server)\//.test(source) || /\.svelte['"]/.test(source)) {
                    violations.push(path);
                }
            }
        }
        expect(violations).toEqual([]);
    });

    it('keeps handwritten source files below 1,000 lines', () => {
        const oversized = sourceFiles(root)
            .filter((file) => readFileSync(file, 'utf8').split('\n').length >= 1000)
            .map((file) => relative(root, file));
        expect(oversized).toEqual([]);
    });
});

function sourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            if (generatedDirectories.has(entry.name)) {
                return [];
            }
            return sourceFiles(path);
        }
        return ['.ts', '.svelte', '.css', '.js', '.yml', '.yaml', '.md'].includes(
            extname(entry.name)
        )
            ? [path]
            : [];
    });
}

const generatedDirectories = new Set([
    '.git',
    '.svelte-kit',
    'build',
    'node_modules',
    'playwright-report',
    'rituals',
    'target',
    'test-results',
    'tmp'
]);
