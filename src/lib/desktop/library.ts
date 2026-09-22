import { invoke, isTauri } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { load } from '@tauri-apps/plugin-store';
import type { OfficiumDocument } from '$lib/data/model';
import { compareDocuments, validateDocumentCollection } from '$lib/data/order';
import { parseDocument, parseDocumentParts } from '$lib/data/parse';

type RawDocument = {
    documentPath: string;
    documentSource: string;
    sectionSources: { path: string; source: string }[];
};

const settingsFile = 'settings.json';
const libraryKey = 'ritual-library';

export function isDesktop(): boolean {
    return isTauri();
}

export async function chooseLibraryRoot(): Promise<string | null> {
    const selected = await open({ directory: true, multiple: false });
    return typeof selected === 'string' ? selected : null;
}

export async function rememberedLibraryRoot(): Promise<string | null> {
    const store = await load(settingsFile);
    return (await store.get<string>(libraryKey)) ?? null;
}

export async function rememberLibraryRoot(root: string): Promise<void> {
    const store = await load(settingsFile);
    await store.set(libraryKey, root);
    await store.save();
}

export async function bundledLibraryRoot(): Promise<string | null> {
    return invoke<string | null>('bundled_library_path');
}

export async function loadDesktopDocuments(root: string): Promise<OfficiumDocument[]> {
    const rawDocuments = await invoke<RawDocument[]>('load_library', { root });
    const documents = rawDocuments.map((raw) =>
        raw.sectionSources.length === 0
            ? parseDocument(raw.documentSource, raw.documentPath)
            : parseDocumentParts(raw.documentSource, raw.sectionSources, raw.documentPath)
    );
    for (const document of documents) {
        await hydrateImageUrls(root, document);
    }
    validateDocumentCollection(documents);
    return documents.sort(compareDocuments);
}

export async function openDesktopSource(root: string, relativePath: string): Promise<void> {
    await invoke('open_source', { root, relativePath });
}

async function hydrateImageUrls(root: string, document: OfficiumDocument): Promise<void> {
    if (document.documentType === 'ritual') {
        for (const section of document.sections) {
            for (const entry of section.entries) {
                for (const part of entry.content) {
                    if (part.type === 'image') {
                        part.runtimeUrl = await libraryImageUrl(root, part.file);
                    }
                }
            }
        }
        return;
    }
    for (const section of document.sections) {
        for (const block of section.blocks) {
            if (block.kind === 'pair' && block.answerImage !== undefined) {
                block.answerImageUrl = await libraryImageUrl(root, block.answerImage);
            }
        }
    }
}

async function libraryImageUrl(root: string, relativePath: string): Promise<string> {
    const bytes = await invoke<ArrayBuffer>('read_library_file', { root, relativePath });
    return URL.createObjectURL(new Blob([bytes], { type: imageMimeType(relativePath) }));
}

function imageMimeType(path: string): string {
    const extension = path.slice(path.lastIndexOf('.')).toLowerCase();
    if (extension === '.png') return 'image/png';
    if (extension === '.webp') return 'image/webp';
    return 'image/jpeg';
}
