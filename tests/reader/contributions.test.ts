import { describe, expect, it } from 'vitest';
import type { CatechismDocument, RitualDocument } from '$lib/data/model';
import { navigationItems } from '$lib/reader/contributions';

const document: RitualDocument = {
    schemaVersion: 1,
    order: 1,
    id: 'example',
    documentType: 'ritual',
    title: 'Voorbeeld',
    language: 'nl',
    source: { file: 'sources/example.pdf' },
    roles: [
        { id: 'chair', label: 'Voorzitter' },
        { id: 'guide', label: 'Gids' }
    ],
    sections: [
        {
            id: 'opening',
            title: 'Opening',
            entries: [
                {
                    id: 'mention',
                    kind: 'speech',
                    speaker: 'chair',
                    text: 'Gids, kom naar voren.',
                    content: [{ type: 'text', text: 'Gids, kom naar voren.' }],
                    source: { pdfPage: 1, printedPage: '1' }
                },
                {
                    id: 'guide-line',
                    kind: 'speech',
                    speaker: 'guide',
                    text: 'Ik ben gereed.',
                    content: [{ type: 'text', text: 'Ik ben gereed.' }],
                    source: { pdfPage: 1, printedPage: '1' }
                },
                {
                    id: 'guide-action',
                    kind: 'action',
                    roles: ['guide'],
                    text: 'De gids loopt naar voren.',
                    content: [{ type: 'text', text: 'De gids loopt naar voren.' }],
                    source: { pdfPage: 2, printedPage: '2' }
                },
                {
                    id: 'context',
                    kind: 'direction',
                    text: 'Het wordt stil.',
                    content: [{ type: 'text', text: 'Het wordt stil.' }],
                    source: { pdfPage: 2, printedPage: '2' }
                }
            ]
        }
    ]
};

describe('contribution index', () => {
    it('includes spoken lines and assigned actions in document order', () => {
        expect(navigationItems(document, 'guide').map((item) => item.id)).toEqual([
            'guide-line',
            'guide-action'
        ]);
    });

    it('does not treat an addressed role or contextual direction as a contribution', () => {
        expect(navigationItems(document, 'guide').map((item) => item.id)).not.toContain('mention');
        expect(navigationItems(document, 'guide').map((item) => item.id)).not.toContain('context');
    });
});

describe('catechism index', () => {
    it('indexes pairs and prompts and leaves explanatory text in document context', () => {
        const catechism: CatechismDocument = {
            schemaVersion: 1,
            order: 1,
            id: 'example-catechism',
            documentType: 'catechism',
            title: 'Voorbeeld',
            language: 'nl',
            source: { file: 'sources/example.pdf' },
            sections: [
                {
                    id: 'first',
                    title: 'Eerste deel',
                    blocks: [
                        {
                            id: 'introduction',
                            kind: 'text',
                            text: 'Inleidende tekst.',
                            source: { pdfPage: 1, printedPage: '1' }
                        },
                        {
                            id: 'purpose',
                            kind: 'pair',
                            question: 'Waarom?',
                            answer: 'Om te leren.',
                            source: { pdfPage: 1, printedPage: '1' }
                        },
                        {
                            id: 'last-letter',
                            kind: 'prompt',
                            text: 'Laatste letter.',
                            source: { pdfPage: 1, printedPage: '1' }
                        }
                    ]
                }
            ]
        };
        expect(navigationItems(catechism, null).map((item) => item.id)).toEqual([
            'purpose',
            'last-letter'
        ]);
    });
});
