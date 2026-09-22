import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('private content', () => {
    it('ignores private content and local working files', () => {
        const ignore = readFileSync('.gitignore', 'utf8').split('\n');
        expect(ignore).toEqual(
            expect.arrayContaining(['/rituals/', '/docs/', '/AGENTS.md', '/CLAUDE.md'])
        );
    });

    it('does not track a path below rituals when the project is in Git', () => {
        const tracked = trackedRitualPaths();
        expect(tracked.trim()).toBe('');
    });
});

function trackedRitualPaths(): string {
    try {
        return execFileSync('git', ['ls-files', 'rituals'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
    } catch {
        return '';
    }
}
