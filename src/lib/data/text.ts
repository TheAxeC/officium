export const textKeys = [
    'app.title',
    'app.subtitle',
    'library.choose',
    'library.change',
    'library.loading',
    'library.none_title',
    'library.none_body',
    'library.error_title',
    'reader.document',
    'reader.role',
    'reader.ritual',
    'reader.catechism',
    'reader.contributions',
    'reader.questions',
    'reader.close',
    'reader.of',
    'reader.previous',
    'reader.next',
    'reader.source',
    'reader.page',
    'reader.page_short',
    'reader.pdf_page_short',
    'reader.section',
    'reader.speech',
    'reader.action',
    'reader.direction',
    'reader.text',
    'reader.contribution',
    'reader.question',
    'reader.answer',
    'reader.empty'
] as const;

export type TextKey = (typeof textKeys)[number];
export type TextCatalog = Record<TextKey, string>;

export function validateTextCatalog(input: unknown, sourcePath: string): TextCatalog {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        throw new Error(`${sourcePath}: expected a mapping`);
    }
    const values = input as Record<string, unknown>;
    const catalog = {} as TextCatalog;
    for (const key of textKeys) {
        const value = values[key];
        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error(`${sourcePath}: ${key}: expected a nonempty string`);
        }
        catalog[key] = value;
    }
    return catalog;
}
