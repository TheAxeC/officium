import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { LibraryFiles } from '$lib/oculus/bridge';
import { loadOculusLibrary, sourcePlace } from '$lib/oculus/library';

const pixel = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3]);

describe('oculus library', () => {
    it('loads the example library when rituals/ is missing', async () => {
        const library = await loadOculusLibrary(fakeFiles(exampleTree()), 'officium');
        expect(library.assetRoot).toBe('examples');
        expect(library.documents.map((item) => item.id)).toEqual([
            'demonstration-ritual',
            'demonstration-catechism'
        ]);
    });

    it('uses only the personal documents when rituals/ holds some, ordered by metadata', async () => {
        const tree = {
            ...exampleTree(),
            'rituals/sources/example.pdf': pixel,
            'rituals/later.yaml': catechism('later-document', 30),
            'rituals/documents/earlier.yaml': catechism('earlier-document', 10)
        };
        const library = await loadOculusLibrary(fakeFiles(tree), 'officium');
        expect(library.assetRoot).toBe('rituals');
        expect(library.documents.map((item) => item.id)).toEqual([
            'earlier-document',
            'later-document'
        ]);
    });

    it('composes a directory document from its ordered section files and inlines its images', async () => {
        const tree = {
            'rituals/composed/document.yaml': `schema_version: 1
order: 1
id: composed
document_type: ritual
title: Samengesteld
language: nl
source:
    file: sources/example.pdf
sections:
    - sections/first.yaml
    - sections/second.yaml
roles:
    - id: guide
      label: Gids
`,
            'rituals/composed/sections/second.yaml': `id: second
title: Tweede
entries:
    - id: second-line
      kind: speech
      speaker: guide
      text: Tweede regel.
      source:
          pdf_page: 2
`,
            'rituals/composed/sections/first.yaml': `id: first
title: Eerste
entries:
    - id: first-line
      kind: speech
      speaker: guide
      content:
          - type: text
            text: Eerste regel.
          - type: image
            file: assets/symbol.png
            alt: Symbool
            display: inline
      source:
          pdf_page: 1
`,
            'rituals/assets/symbol.png': pixel,
            'rituals/sources/example.pdf': pixel
        };
        const library = await loadOculusLibrary(fakeFiles(tree), 'officium');
        const document = library.documents[0];
        expect(document.documentType).toBe('ritual');
        if (document.documentType !== 'ritual') return;
        expect(document.sections.map((section) => section.id)).toEqual(['first', 'second']);
        const image = document.sections[0].entries[0].content[1];
        expect(image.type === 'image' ? image.runtimeUrl : undefined).toBe(
            `data:image/png;base64,${Buffer.from(pixel).toString('base64')}`
        );
    });

    it('returns no documents when neither folder holds any', async () => {
        const library = await loadOculusLibrary(fakeFiles({}), 'officium');
        expect(library.documents).toEqual([]);
    });

    it('fails with the refusal word when a folder cannot be read', async () => {
        const files: LibraryFiles = {
            readFile: () => Promise.reject('closed'),
            readDirectory: () => Promise.reject('closed'),
            stat: () => Promise.reject('closed')
        };
        await expect(loadOculusLibrary(files, 'officium')).rejects.toThrow('rituals: closed');
    });

    it('rejects a section path that leaves the sections folder', async () => {
        const tree = {
            'rituals/bad/document.yaml': `schema_version: 1
order: 1
id: bad
document_type: ritual
title: Fout
language: nl
source:
    file: sources/example.pdf
sections:
    - ../secret.yaml
roles:
    - id: guide
      label: Gids
`
        };
        await expect(loadOculusLibrary(fakeFiles(tree), 'officium')).rejects.toThrow(
            "expected a path shaped like 'sections/opening.yaml'"
        );
    });

    it('refuses a document whose source file is missing', async () => {
        const tree = { 'rituals/a.yaml': catechism('a-document', 10) };
        await expect(loadOculusLibrary(fakeFiles(tree), 'officium')).rejects.toThrow(
            'rituals/a.yaml: source.file: file does not exist: rituals/sources/example.pdf'
        );
    });

    it('skips an entry that is a link, as the server catalogue does', async () => {
        const tree = {
            'rituals/sources/example.pdf': pixel,
            'rituals/real.yaml': catechism('only-document', 10),
            'rituals/current.yaml': catechism('only-document', 10)
        };
        const library = await loadOculusLibrary(
            fakeFiles(tree, new Set(['rituals/current.yaml'])),
            'officium'
        );
        expect(library.documents.map((item) => item.id)).toEqual(['only-document']);
    });

    it('names a source file under the folder its documents came from', async () => {
        const library = await loadOculusLibrary(fakeFiles(exampleTree()), 'officium');
        expect(sourcePlace('officium', library, 'sources/demonstration-ritual.pdf', 3)).toEqual({
            root: 'officium',
            path: 'examples/sources/demonstration-ritual.pdf',
            page: 3
        });
    });
});

function exampleTree(): Record<string, string | Uint8Array> {
    return {
        'examples/sources/demonstration-ritual.pdf': pixel,
        'examples/sources/demonstration-catechism.pdf': pixel,
        'examples/rituals/demonstration-ritual.yaml': readFileSync(
            'examples/rituals/demonstration-ritual.yaml',
            'utf8'
        ),
        'examples/rituals/demonstration-catechism.yaml': readFileSync(
            'examples/rituals/demonstration-catechism.yaml',
            'utf8'
        )
    };
}

function catechism(id: string, order: number): string {
    return `schema_version: 1
order: ${order}
id: ${id}
document_type: catechism
title: ${id}
language: nl
source:
    file: sources/example.pdf
sections:
    - id: content
      title: Inhoud
      blocks:
          - id: introduction
            type: text
            text: Voorbeeld.
            source:
                pdf_page: 1
`;
}

const linkFlag = 64;

function fakeFiles(
    tree: Record<string, string | Uint8Array>,
    links: Set<string> = new Set()
): LibraryFiles {
    return {
        stat: ({ path }) => (path in tree ? Promise.resolve({}) : Promise.reject('missing')),
        readFile: ({ path }) => {
            const content = tree[path];
            if (content === undefined) return Promise.reject('missing');
            return Promise.resolve(
                typeof content === 'string' ? new TextEncoder().encode(content) : content
            );
        },
        readDirectory: ({ path }) => {
            const names = new Map<string, number>();
            for (const file of Object.keys(tree)) {
                if (!file.startsWith(`${path}/`)) continue;
                const rest = file.slice(path.length + 1);
                const slash = rest.indexOf('/');
                const type = slash === -1 ? 1 : 2;
                names.set(
                    slash === -1 ? rest : rest.slice(0, slash),
                    links.has(file) ? type + linkFlag : type
                );
            }
            if (names.size === 0) return Promise.reject('missing');
            return Promise.resolve([...names.entries()]);
        }
    };
}
