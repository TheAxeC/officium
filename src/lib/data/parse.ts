import { parse } from 'yaml';
import type { OfficiumDocument } from './model';
import { DocumentValidationError, validateDocument } from './validate';

export function parseDocument(source: string, documentPath: string): OfficiumDocument {
    return validateDocument(parseYaml(source, documentPath), documentPath);
}

export function parseDocumentParts(
    documentSource: string,
    sectionSources: { source: string; path: string }[],
    documentPath: string
): OfficiumDocument {
    const documentValue = parseYaml(documentSource, documentPath);
    if (
        typeof documentValue !== 'object' ||
        documentValue === null ||
        Array.isArray(documentValue)
    ) {
        throw new DocumentValidationError(documentPath, '$', 'expected an object');
    }
    const sections = sectionSources.map(({ source, path }) => parseYaml(source, path));
    return validateDocument({ ...documentValue, sections }, documentPath);
}

function parseYaml(source: string, documentPath: string): unknown {
    try {
        return parse(source);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new DocumentValidationError(documentPath, '$', `invalid YAML: ${message}`);
    }
}
