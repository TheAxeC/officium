import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findAnswerImage, findEntryImage, loadCatalogue } from '$lib/server/catalogue';

describe('example catalogue', () => {
    it('loads the available corpus and verifies its source PDFs', () => {
        const documents = loadCatalogue();
        expect(documents.length).toBeGreaterThan(0);
        expect(documents.every((item) => item.sourcePath.endsWith('.pdf'))).toBe(true);
    });

    it('uses document metadata order and hides examples when personal documents exist', () => {
        const projectRoot = mkdtempSync(join(tmpdir(), 'officium-order-'));
        try {
            mkdirSync(join(projectRoot, 'examples', 'rituals'), { recursive: true });
            mkdirSync(join(projectRoot, 'examples', 'sources'), { recursive: true });
            mkdirSync(join(projectRoot, 'rituals', 'documents'), { recursive: true });
            mkdirSync(join(projectRoot, 'rituals', 'sources'), { recursive: true });
            writeFileSync(join(projectRoot, 'examples', 'sources', 'example.pdf'), 'pdf');
            writeFileSync(join(projectRoot, 'rituals', 'sources', 'example.pdf'), 'pdf');
            writeCatechism(
                join(projectRoot, 'examples', 'rituals', 'demonstration.yaml'),
                'demonstration',
                'Demonstration',
                1
            );
            const documents = [
                { id: 'third-document', order: 30 },
                { id: 'first-document', order: 10 },
                { id: 'second-document', order: 20 }
            ];
            for (const document of documents) {
                writeCatechism(
                    join(projectRoot, 'rituals', 'documents', `${document.id}.yaml`),
                    document.id,
                    document.id,
                    document.order
                );
            }
            expect(loadCatalogue(projectRoot).map((item) => item.document.id)).toEqual([
                'first-document',
                'second-document',
                'third-document'
            ]);
        } finally {
            rmSync(projectRoot, { recursive: true, force: true });
        }
    });

    it('resolves answer images inside the document corpus', () => {
        const projectRoot = mkdtempSync(join(tmpdir(), 'officium-catalogue-'));
        try {
            mkdirSync(join(projectRoot, 'examples', 'rituals'), { recursive: true });
            mkdirSync(join(projectRoot, 'examples', 'sources'), { recursive: true });
            mkdirSync(join(projectRoot, 'examples', 'assets'), { recursive: true });
            writeFileSync(join(projectRoot, 'examples', 'sources', 'example.pdf'), 'pdf');
            writeFileSync(join(projectRoot, 'examples', 'assets', 'answer.png'), 'png');
            writeFileSync(
                join(projectRoot, 'examples', 'rituals', 'example.yaml'),
                `schema_version: 1
order: 1
id: illustrated
document_type: catechism
title: Voorbeeld
language: nl
source:
    file: sources/example.pdf
sections:
    - id: first
      title: Eerste
      blocks:
          - id: gesture
            type: pair
            question: Welk gebaar?
            answer_image: assets/answer.png
            source:
                pdf_page: 1
                printed_page: "1"
`
            );
            expect(findAnswerImage('illustrated', 'gesture', projectRoot)).toBe(
                realpathSync(join(projectRoot, 'examples', 'assets', 'answer.png'))
            );
        } finally {
            rmSync(projectRoot, { recursive: true, force: true });
        }
    });

    it('composes a ritual directory from its ordered semantic section files', () => {
        const projectRoot = mkdtempSync(join(tmpdir(), 'officium-sections-'));
        try {
            const ritualRoot = join(projectRoot, 'examples', 'rituals', 'composed');
            mkdirSync(join(ritualRoot, 'sections'), { recursive: true });
            mkdirSync(join(projectRoot, 'examples', 'sources'), { recursive: true });
            mkdirSync(join(projectRoot, 'examples', 'assets'), { recursive: true });
            writeFileSync(join(projectRoot, 'examples', 'sources', 'example.pdf'), 'pdf');
            writeFileSync(join(projectRoot, 'examples', 'assets', 'symbol.png'), 'png');
            writeFileSync(
                join(ritualRoot, 'document.yaml'),
                `schema_version: 1
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
`
            );
            writeFileSync(
                join(ritualRoot, 'sections', 'second.yaml'),
                `id: second
title: Tweede
entries:
    - id: second-line
      kind: speech
      speaker: guide
      text: Tweede regel.
      source:
          pdf_page: 2
`
            );
            writeFileSync(
                join(ritualRoot, 'sections', 'first.yaml'),
                `id: first
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
`
            );
            const loaded = loadCatalogue(projectRoot).find(
                (item) => item.document.id === 'composed'
            );
            expect(loaded?.document.documentType).toBe('ritual');
            if (loaded?.document.documentType === 'ritual') {
                expect(loaded.document.sections.map((section) => section.id)).toEqual([
                    'first',
                    'second'
                ]);
            }
            expect(findEntryImage('composed', 'first-line', 1, projectRoot)).toBe(
                realpathSync(join(projectRoot, 'examples', 'assets', 'symbol.png'))
            );
        } finally {
            rmSync(projectRoot, { recursive: true, force: true });
        }
    });
});

function writeCatechism(path: string, id: string, title: string, order: number): void {
    writeFileSync(
        path,
        `schema_version: 1
order: ${order}
id: ${id}
document_type: catechism
title: ${title}
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
`
    );
}
