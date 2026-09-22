import type {
    ActionEntry,
    CatechismBlock,
    CatechismDocument,
    CatechismPair,
    ContextEntry,
    DocumentSource,
    OfficiumDocument,
    RitualDocument,
    RitualContentPart,
    RitualEntry,
    Role,
    SourcePage,
    SpeechEntry
} from './model';

export class DocumentValidationError extends Error {
    constructor(
        readonly documentPath: string,
        readonly field: string,
        message: string
    ) {
        super(`${documentPath}: ${field}: ${message}`);
        this.name = 'DocumentValidationError';
    }
}

type RecordValue = Record<string, unknown>;

export function validateDocument(input: unknown, documentPath: string): OfficiumDocument {
    const root = record(input, documentPath, '$');
    integer(root.schema_version, documentPath, 'schema_version', 1);
    const common = {
        schemaVersion: 1 as const,
        id: identifier(root.id, documentPath, 'id'),
        order: positiveInteger(root.order, documentPath, 'order'),
        title: nonemptyString(root.title, documentPath, 'title'),
        language: nonemptyString(root.language, documentPath, 'language'),
        source: documentSource(root.source, documentPath, 'source')
    };
    const documentType = nonemptyString(root.document_type, documentPath, 'document_type');
    if (documentType === 'ritual') {
        return ritualDocument(root, common, documentPath);
    }
    if (documentType === 'catechism') {
        return catechismDocument(root, common, documentPath);
    }
    fail(documentPath, 'document_type', "expected 'ritual' or 'catechism'");
}

function ritualDocument(
    root: RecordValue,
    common: Omit<RitualDocument, 'documentType' | 'roles' | 'sections'>,
    documentPath: string
): RitualDocument {
    const roles = array(root.roles, documentPath, 'roles').map((value, index) =>
        role(value, documentPath, `roles[${index}]`)
    );
    requireUnique(
        roles.map((item) => item.id),
        documentPath,
        'roles'
    );
    const roleIds = new Set(roles.map((item) => item.id));
    const sections = array(root.sections, documentPath, 'sections').map((value, sectionIndex) => {
        const path = `sections[${sectionIndex}]`;
        const section = record(value, documentPath, path);
        const entries = array(section.entries, documentPath, `${path}.entries`).map(
            (entryValue, entryIndex) =>
                ritualEntry(entryValue, roleIds, documentPath, `${path}.entries[${entryIndex}]`)
        );
        requireNonempty(entries, documentPath, `${path}.entries`);
        requireUnique(
            entries.map((entry) => entry.id),
            documentPath,
            `${path}.entries`
        );
        return {
            id: identifier(section.id, documentPath, `${path}.id`),
            title: nonemptyString(section.title, documentPath, `${path}.title`),
            entries
        };
    });
    requireNonempty(roles, documentPath, 'roles');
    requireNonempty(sections, documentPath, 'sections');
    requireUnique(
        sections.map((section) => section.id),
        documentPath,
        'sections'
    );
    const allEntryIds = sections.flatMap((section) => section.entries.map((entry) => entry.id));
    requireUnique(allEntryIds, documentPath, 'sections.entries');
    return { ...common, documentType: 'ritual', roles, sections };
}

function catechismDocument(
    root: RecordValue,
    common: Omit<CatechismDocument, 'documentType' | 'sections'>,
    documentPath: string
): CatechismDocument {
    const sections = array(root.sections, documentPath, 'sections').map((value, sectionIndex) => {
        const path = `sections[${sectionIndex}]`;
        const section = record(value, documentPath, path);
        const blocks = array(section.blocks, documentPath, `${path}.blocks`).map(
            (blockValue, blockIndex) =>
                catechismBlock(blockValue, documentPath, `${path}.blocks[${blockIndex}]`)
        );
        requireNonempty(blocks, documentPath, `${path}.blocks`);
        requireUnique(
            blocks.map((block) => block.id),
            documentPath,
            `${path}.blocks`
        );
        return {
            id: identifier(section.id, documentPath, `${path}.id`),
            title: nonemptyString(section.title, documentPath, `${path}.title`),
            blocks
        };
    });
    requireNonempty(sections, documentPath, 'sections');
    requireUnique(
        sections.map((section) => section.id),
        documentPath,
        'sections'
    );
    requireUnique(
        sections.flatMap((section) => section.blocks.map((block) => block.id)),
        documentPath,
        'sections.blocks'
    );
    return { ...common, documentType: 'catechism', sections };
}

function ritualEntry(
    input: unknown,
    roleIds: Set<string>,
    documentPath: string,
    field: string
): RitualEntry {
    const value = record(input, documentPath, field);
    const content = ritualContent(value, documentPath, field);
    const base = {
        id: identifier(value.id, documentPath, `${field}.id`),
        text: content
            .filter(
                (part): part is Extract<RitualContentPart, { type: 'text' }> => part.type === 'text'
            )
            .map((part) => part.text)
            .join(' '),
        content,
        source: sourcePage(value.source, documentPath, `${field}.source`)
    };
    const kind = nonemptyString(value.kind, documentPath, `${field}.kind`);
    if (kind === 'speech') {
        const speaker = knownRole(value.speaker, roleIds, documentPath, `${field}.speaker`);
        return { ...base, kind, speaker } satisfies SpeechEntry;
    }
    if (kind === 'action') {
        const roles = array(value.roles, documentPath, `${field}.roles`).map((roleValue, index) =>
            knownRole(roleValue, roleIds, documentPath, `${field}.roles[${index}]`)
        );
        requireNonempty(roles, documentPath, `${field}.roles`);
        requireUnique(roles, documentPath, `${field}.roles`);
        return { ...base, kind, roles } satisfies ActionEntry;
    }
    if (kind === 'direction' || kind === 'text') {
        return { ...base, kind } satisfies ContextEntry;
    }
    fail(documentPath, `${field}.kind`, 'expected speech, action, direction, or text');
}

function ritualContent(
    value: RecordValue,
    documentPath: string,
    field: string
): RitualContentPart[] {
    const hasText = value.text !== undefined;
    const hasContent = value.content !== undefined;
    if (hasText === hasContent) {
        fail(documentPath, field, 'expected exactly one of text or content');
    }
    if (hasText) {
        return [{ type: 'text', text: nonemptyString(value.text, documentPath, `${field}.text`) }];
    }
    const parts = array(value.content, documentPath, `${field}.content`).map((input, index) => {
        const partField = `${field}.content[${index}]`;
        const part = record(input, documentPath, partField);
        const type = nonemptyString(part.type, documentPath, `${partField}.type`);
        if (type === 'text') {
            return {
                type,
                text: nonemptyString(part.text, documentPath, `${partField}.text`)
            } satisfies RitualContentPart;
        }
        if (type === 'image') {
            const display = nonemptyString(part.display, documentPath, `${partField}.display`);
            if (display !== 'inline' && display !== 'block') {
                fail(documentPath, `${partField}.display`, "expected 'inline' or 'block'");
            }
            return {
                type,
                file: relativeImage(part.file, documentPath, `${partField}.file`),
                alt: nonemptyString(part.alt, documentPath, `${partField}.alt`),
                display
            } satisfies RitualContentPart;
        }
        fail(documentPath, `${partField}.type`, "expected 'text' or 'image'");
    });
    requireNonempty(parts, documentPath, `${field}.content`);
    if (!parts.some((part) => part.type === 'text')) {
        fail(documentPath, `${field}.content`, 'expected at least one text part');
    }
    return parts;
}

function catechismBlock(input: unknown, documentPath: string, field: string): CatechismBlock {
    const value = record(input, documentPath, field);
    const base = {
        id: identifier(value.id, documentPath, `${field}.id`),
        source: sourcePage(value.source, documentPath, `${field}.source`)
    };
    const kind = nonemptyString(value.type, documentPath, `${field}.type`);
    if (kind === 'text') {
        return {
            ...base,
            kind,
            text: nonemptyString(value.text, documentPath, `${field}.text`)
        };
    }
    if (kind === 'prompt') {
        return {
            ...base,
            kind,
            text: nonemptyString(value.text, documentPath, `${field}.text`)
        };
    }
    if (kind !== 'pair') {
        fail(documentPath, `${field}.type`, 'expected text, prompt, or pair');
    }
    const answer = optionalNonemptyString(value.answer, documentPath, `${field}.answer`);
    const answerImage = optionalRelativeImage(
        value.answer_image,
        documentPath,
        `${field}.answer_image`
    );
    if ((answer === undefined) === (answerImage === undefined)) {
        fail(documentPath, field, 'expected exactly one of answer or answer_image');
    }
    return {
        ...base,
        kind,
        question: nonemptyString(value.question, documentPath, `${field}.question`),
        ...(answer === undefined ? {} : { answer }),
        ...(answerImage === undefined ? {} : { answerImage })
    } satisfies CatechismPair;
}

function optionalNonemptyString(
    input: unknown,
    documentPath: string,
    field: string
): string | undefined {
    return input === undefined ? undefined : nonemptyString(input, documentPath, field);
}

function optionalRelativeImage(
    input: unknown,
    documentPath: string,
    field: string
): string | undefined {
    if (input === undefined) {
        return undefined;
    }
    return relativeImage(input, documentPath, field);
}

function relativeImage(input: unknown, documentPath: string, field: string): string {
    const file = nonemptyString(input, documentPath, field);
    const segments = file.split('/');
    if (
        file.startsWith('/') ||
        segments.includes('..') ||
        segments.includes('.') ||
        !/\.(png|jpe?g|webp)$/i.test(file)
    ) {
        fail(
            documentPath,
            field,
            'expected a relative PNG, JPEG, or WebP path without dot segments'
        );
    }
    return file;
}

function role(input: unknown, documentPath: string, field: string): Role {
    const value = record(input, documentPath, field);
    return {
        id: identifier(value.id, documentPath, `${field}.id`),
        label: nonemptyString(value.label, documentPath, `${field}.label`)
    };
}

function documentSource(input: unknown, documentPath: string, field: string): DocumentSource {
    const value = record(input, documentPath, field);
    const file = nonemptyString(value.file, documentPath, `${field}.file`);
    const segments = file.split('/');
    if (
        file.startsWith('/') ||
        segments.includes('..') ||
        segments.includes('.') ||
        !file.endsWith('.pdf')
    ) {
        fail(documentPath, `${field}.file`, 'expected a relative PDF path without dot segments');
    }
    return { file };
}

function sourcePage(input: unknown, documentPath: string, field: string): SourcePage {
    const value = record(input, documentPath, field);
    return {
        pdfPage: positiveInteger(value.pdf_page, documentPath, `${field}.pdf_page`),
        printedPage: optionalNonemptyString(
            value.printed_page,
            documentPath,
            `${field}.printed_page`
        )
    };
}

function knownRole(
    input: unknown,
    roleIds: Set<string>,
    documentPath: string,
    field: string
): string {
    const value = identifier(input, documentPath, field);
    if (!roleIds.has(value)) {
        fail(documentPath, field, `unknown role '${value}'`);
    }
    return value;
}

function record(input: unknown, documentPath: string, field: string): RecordValue {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        fail(documentPath, field, 'expected an object');
    }
    return input as RecordValue;
}

function array(input: unknown, documentPath: string, field: string): unknown[] {
    if (!Array.isArray(input)) {
        fail(documentPath, field, 'expected an array');
    }
    return input;
}

function nonemptyString(input: unknown, documentPath: string, field: string): string {
    if (typeof input !== 'string' || input.trim() === '') {
        fail(documentPath, field, 'expected a nonempty string');
    }
    return input;
}

function identifier(input: unknown, documentPath: string, field: string): string {
    const value = nonemptyString(input, documentPath, field);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
        fail(documentPath, field, 'expected a lowercase ASCII identifier');
    }
    return value;
}

function integer(input: unknown, documentPath: string, field: string, expected: number): number {
    if (input !== expected) {
        fail(documentPath, field, `expected ${expected}`);
    }
    return expected;
}

function positiveInteger(input: unknown, documentPath: string, field: string): number {
    if (!Number.isInteger(input) || (input as number) < 1) {
        fail(documentPath, field, 'expected a positive integer');
    }
    return input as number;
}

function requireNonempty(values: unknown[], documentPath: string, field: string): void {
    if (values.length === 0) {
        fail(documentPath, field, 'must not be empty');
    }
}

function requireUnique(values: string[], documentPath: string, field: string): void {
    const seen = new Set<string>();
    for (const value of values) {
        if (seen.has(value)) {
            fail(documentPath, field, `duplicate identifier '${value}'`);
        }
        seen.add(value);
    }
}

function fail(documentPath: string, field: string, message: string): never {
    throw new DocumentValidationError(documentPath, field, message);
}
