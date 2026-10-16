import type { OfficiumDocument } from './model';

export function imageMimeType(path: string): string {
    const extension = path.slice(path.lastIndexOf('.')).toLowerCase();
    if (extension === '.png') return 'image/png';
    if (extension === '.webp') return 'image/webp';
    return 'image/jpeg';
}

export async function attachImageUrls(
    document: OfficiumDocument,
    urlFor: (relativePath: string) => Promise<string>
): Promise<void> {
    if (document.documentType === 'ritual') {
        for (const section of document.sections) {
            for (const entry of section.entries) {
                for (const part of entry.content) {
                    if (part.type === 'image') {
                        part.runtimeUrl = await urlFor(part.file);
                    }
                }
            }
        }
        return;
    }
    for (const section of document.sections) {
        for (const block of section.blocks) {
            if (block.kind === 'pair' && block.answerImage !== undefined) {
                block.answerImageUrl = await urlFor(block.answerImage);
            }
        }
    }
}
