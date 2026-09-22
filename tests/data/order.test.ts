import { describe, expect, it } from 'vitest';
import { compareDocuments, validateDocumentCollection } from '$lib/data/order';
import { parseDocument } from '$lib/data/parse';

describe('document order', () => {
    it('sorts documents by their declared order', () => {
        const documents = [document('third', 30), document('first', 10), document('second', 20)];
        expect(documents.sort(compareDocuments).map((item) => item.id)).toEqual([
            'first',
            'second',
            'third'
        ]);
    });

    it('rejects duplicate order values', () => {
        expect(() =>
            validateDocumentCollection([document('first', 10), document('second', 10)])
        ).toThrow("duplicate document order '10'");
    });

    it('requires a positive order value', () => {
        expect(() => document('invalid', 0)).toThrow(
            'invalid.yaml: order: expected a positive integer'
        );
    });
});

function document(id: string, order: number) {
    return parseDocument(
        `schema_version: 1
id: ${id}
order: ${order}
document_type: catechism
title: ${id}
language: en
source:
    file: sources/example.pdf
sections:
    - id: review
      title: Review
      blocks:
          - id: introduction
            type: text
            text: Example.
            source:
                pdf_page: 1
`,
        `${id}.yaml`
    );
}
