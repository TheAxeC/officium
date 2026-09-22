import type { OfficiumDocument } from './model';

export function compareDocuments(left: OfficiumDocument, right: OfficiumDocument): number {
    return left.order - right.order || left.title.localeCompare(right.title);
}

export function validateDocumentCollection(documents: OfficiumDocument[]): void {
    requireUnique(documents, (document) => document.id, 'document identifier');
    requireUnique(documents, (document) => document.order, 'document order');
}

function requireUnique(
    documents: OfficiumDocument[],
    value: (document: OfficiumDocument) => string | number,
    label: string
): void {
    const seen = new Set<string | number>();
    for (const document of documents) {
        const current = value(document);
        if (seen.has(current)) {
            throw new Error(`duplicate ${label} '${current}'`);
        }
        seen.add(current);
    }
}
