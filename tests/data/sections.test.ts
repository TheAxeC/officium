import { describe, expect, it } from 'vitest';
import { listedSectionNames } from '$lib/data/sections';

describe('listed section names', () => {
    it('returns the section paths in their listed order', () => {
        const source = 'sections:\n    - sections/second.yaml\n    - sections/first.yaml\n';
        expect(listedSectionNames(source, 'document.yaml')).toEqual([
            'sections/second.yaml',
            'sections/first.yaml'
        ]);
    });

    it('rejects a manifest that is not an object', () => {
        expect(() => listedSectionNames('- a\n', 'document.yaml')).toThrow('expected an object');
    });

    it('rejects an empty or missing sections list', () => {
        expect(() => listedSectionNames('id: a\n', 'document.yaml')).toThrow(
            'expected a non-empty list of section file paths'
        );
        expect(() => listedSectionNames('sections: []\n', 'document.yaml')).toThrow(
            'expected a non-empty list of section file paths'
        );
    });

    it('rejects a path outside the sections folder shape', () => {
        for (const path of ['../a.yaml', 'sections/A.yaml', 'sections/a/b.yaml', 'a.yaml']) {
            expect(() => listedSectionNames(`sections:\n    - ${path}\n`, 'document.yaml')).toThrow(
                "expected a path shaped like 'sections/opening.yaml'"
            );
        }
    });

    it('reports YAML that does not parse', () => {
        expect(() => listedSectionNames('sections: [\n', 'document.yaml')).toThrow('invalid YAML');
    });
});
