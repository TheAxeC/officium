import { parse } from 'yaml';
import { DocumentValidationError } from './validate';

export function listedSectionNames(source: string, documentPath: string): string[] {
    let value: unknown;
    try {
        value = parse(source);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new DocumentValidationError(documentPath, '$', `invalid YAML: ${message}`);
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new DocumentValidationError(documentPath, '$', 'expected an object');
    }
    const sections = (value as Record<string, unknown>).sections;
    if (!Array.isArray(sections) || sections.length === 0) {
        throw new DocumentValidationError(
            documentPath,
            '$.sections',
            'expected a non-empty list of section file paths'
        );
    }
    return sections.map((section, index) => {
        if (typeof section !== 'string' || !/^sections\/[a-z0-9-]+\.yaml$/.test(section)) {
            throw new DocumentValidationError(
                documentPath,
                `$.sections[${index}]`,
                "expected a path shaped like 'sections/opening.yaml'"
            );
        }
        return section;
    });
}
