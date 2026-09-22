import { describe, expect, it } from 'vitest';
import { validateDocument } from '$lib/data/validate';

const source = { file: 'sources/example.pdf' };
const page = { pdf_page: 1, printed_page: '1' };

describe('document validation', () => {
    it('accepts a ritual with explicit role ownership', () => {
        const document = validateDocument(
            {
                schema_version: 1,
                order: 1,
                id: 'example',
                document_type: 'ritual',
                title: 'Voorbeeld',
                language: 'nl',
                source,
                roles: [{ id: 'guide', label: 'Gids' }],
                sections: [
                    {
                        id: 'opening',
                        title: 'Opening',
                        entries: [
                            {
                                id: 'line',
                                kind: 'speech',
                                speaker: 'guide',
                                text: 'Welkom.',
                                source: page
                            },
                            {
                                id: 'move',
                                kind: 'action',
                                roles: ['guide'],
                                text: 'De gids staat op.',
                                source: page
                            }
                        ]
                    }
                ]
            },
            'example.yaml'
        );
        expect(document.documentType).toBe('ritual');
    });

    it('accepts ordered text and image content in ritual entries', () => {
        const document = validateDocument(
            {
                schema_version: 1,
                order: 1,
                id: 'illustrated-ritual',
                document_type: 'ritual',
                title: 'Geillustreerd ritueel',
                language: 'nl',
                source,
                roles: [{ id: 'guide', label: 'Gids' }],
                sections: [
                    {
                        id: 'opening',
                        title: 'Opening',
                        entries: [
                            {
                                id: 'line',
                                kind: 'speech',
                                speaker: 'guide',
                                content: [
                                    { type: 'text', text: 'Eerste deel.' },
                                    {
                                        type: 'image',
                                        file: 'assets/symbol.png',
                                        alt: 'Symbool',
                                        display: 'inline'
                                    },
                                    { type: 'text', text: 'Tweede deel.' }
                                ],
                                source: page
                            }
                        ]
                    }
                ]
            },
            'illustrated.yaml'
        );
        expect(document.documentType).toBe('ritual');
        if (document.documentType === 'ritual') {
            expect(document.sections[0].entries[0].text).toBe('Eerste deel. Tweede deel.');
            expect(document.sections[0].entries[0].content).toHaveLength(3);
        }
    });

    it('accepts catechism text, prompts, textual answers, and image answers', () => {
        const document = validateDocument(
            {
                schema_version: 1,
                order: 1,
                id: 'example-catechism',
                document_type: 'catechism',
                title: 'Voorbeeld',
                language: 'nl',
                source,
                sections: [
                    {
                        id: 'first',
                        title: 'Eerste deel',
                        blocks: [
                            {
                                id: 'introduction',
                                type: 'text',
                                text: 'Een korte inleiding.',
                                source: page
                            },
                            {
                                id: 'purpose',
                                type: 'pair',
                                question: 'Waarom?',
                                answer: 'Om te leren.',
                                source: page
                            },
                            {
                                id: 'final-letter',
                                type: 'prompt',
                                text: 'Laatste letter.',
                                source: page
                            },
                            {
                                id: 'gesture',
                                type: 'pair',
                                question: 'Welk gebaar?',
                                answer_image: 'assets/gesture.png',
                                source: page
                            }
                        ]
                    }
                ]
            },
            'catechism.yaml'
        );
        expect(document.documentType).toBe('catechism');
        if (document.documentType === 'catechism') {
            expect(document.sections[0].blocks.map((block) => block.kind)).toEqual([
                'text',
                'pair',
                'prompt',
                'pair'
            ]);
        }
    });

    it('rejects an unknown role reference', () => {
        expect(() =>
            validateDocument(
                {
                    schema_version: 1,
                    order: 1,
                    id: 'example',
                    document_type: 'ritual',
                    title: 'Voorbeeld',
                    language: 'nl',
                    source,
                    roles: [{ id: 'guide', label: 'Gids' }],
                    sections: [
                        {
                            id: 'opening',
                            title: 'Opening',
                            entries: [
                                {
                                    id: 'line',
                                    kind: 'speech',
                                    speaker: 'reader',
                                    text: 'Welkom.',
                                    source: page
                                }
                            ]
                        }
                    ]
                },
                'unknown-role.yaml'
            )
        ).toThrow("unknown-role.yaml: sections[0].entries[0].speaker: unknown role 'reader'");
    });

    it('rejects an incomplete catechism pair', () => {
        expect(() =>
            validateDocument(
                {
                    schema_version: 1,
                    order: 1,
                    id: 'example-catechism',
                    document_type: 'catechism',
                    title: 'Voorbeeld',
                    language: 'nl',
                    source,
                    sections: [
                        {
                            id: 'first',
                            title: 'Eerste deel',
                            blocks: [
                                {
                                    id: 'purpose',
                                    type: 'pair',
                                    question: 'Waarom?',
                                    source: page
                                }
                            ]
                        }
                    ]
                },
                'incomplete-pair.yaml'
            )
        ).toThrow(
            'incomplete-pair.yaml: sections[0].blocks[0]: expected exactly one of answer or answer_image'
        );
    });

    it('rejects a pair with both textual and image answers', () => {
        expect(() =>
            validateDocument(
                {
                    schema_version: 1,
                    order: 1,
                    id: 'example-catechism',
                    document_type: 'catechism',
                    title: 'Voorbeeld',
                    language: 'nl',
                    source,
                    sections: [
                        {
                            id: 'first',
                            title: 'Eerste deel',
                            blocks: [
                                {
                                    id: 'purpose',
                                    type: 'pair',
                                    question: 'Waarom?',
                                    answer: 'Daarom.',
                                    answer_image: 'assets/answer.png',
                                    source: page
                                }
                            ]
                        }
                    ]
                },
                'double-answer.yaml'
            )
        ).toThrow(
            'double-answer.yaml: sections[0].blocks[0]: expected exactly one of answer or answer_image'
        );
    });

    it('rejects duplicate entry identifiers across sections', () => {
        expect(() =>
            validateDocument(
                {
                    schema_version: 1,
                    order: 1,
                    id: 'example',
                    document_type: 'ritual',
                    title: 'Voorbeeld',
                    language: 'nl',
                    source,
                    roles: [{ id: 'guide', label: 'Gids' }],
                    sections: [
                        {
                            id: 'first',
                            title: 'Eerste',
                            entries: [{ id: 'line', kind: 'text', text: 'Een.', source: page }]
                        },
                        {
                            id: 'second',
                            title: 'Tweede',
                            entries: [{ id: 'line', kind: 'text', text: 'Twee.', source: page }]
                        }
                    ]
                },
                'duplicate.yaml'
            )
        ).toThrow("duplicate identifier 'line'");
    });

    it('rejects source paths that can leave a corpus', () => {
        expect(() =>
            validateDocument(
                {
                    schema_version: 1,
                    order: 1,
                    id: 'example-catechism',
                    document_type: 'catechism',
                    title: 'Voorbeeld',
                    language: 'nl',
                    source: { file: '../private.pdf' },
                    sections: [
                        {
                            id: 'first',
                            title: 'Eerste deel',
                            blocks: [
                                {
                                    id: 'purpose',
                                    type: 'pair',
                                    question: 'Waarom?',
                                    answer: 'Daarom.',
                                    source: page
                                }
                            ]
                        }
                    ]
                },
                'escape.yaml'
            )
        ).toThrow('expected a relative PDF path without dot segments');
    });

    it('accepts an unnumbered PDF page without a printed page label', () => {
        const document = validateDocument(
            {
                schema_version: 1,
                order: 1,
                id: 'unnumbered',
                document_type: 'catechism',
                title: 'Voorbeeld',
                language: 'nl',
                source,
                sections: [
                    {
                        id: 'title',
                        title: 'Titel',
                        blocks: [
                            {
                                id: 'heading',
                                type: 'text',
                                text: 'Titelblad',
                                source: { pdf_page: 1 }
                            }
                        ]
                    }
                ]
            },
            'unnumbered.yaml'
        );
        if (document.documentType === 'catechism') {
            expect(document.sections[0].blocks[0].source.printedPage).toBeUndefined();
        }
    });
});
