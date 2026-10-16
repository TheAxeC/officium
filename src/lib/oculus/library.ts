import { attachImageUrls, imageMimeType } from '$lib/data/images';
import type { OfficiumDocument } from '$lib/data/model';
import { compareDocuments, validateDocumentCollection } from '$lib/data/order';
import { parseDocument, parseDocumentParts } from '$lib/data/parse';
import { listedSectionNames } from '$lib/data/sections';
import type { LibraryFiles, Place } from './bridge';

export type OculusLibrary = {
    documents: OfficiumDocument[];
    assetRoot: string;
};

type Corpus = {
    assetRoot: string;
    documentRoot: string;
};

type Definition = {
    path: string;
    directory: string | null;
};

const personalCorpus: Corpus = { assetRoot: 'rituals', documentRoot: 'rituals' };
const exampleCorpus: Corpus = { assetRoot: 'examples', documentRoot: 'examples/rituals' };

const folderType = 2;
const fileType = 1;

export async function loadOculusLibrary(files: LibraryFiles, root: string): Promise<OculusLibrary> {
    for (const corpus of [personalCorpus, exampleCorpus]) {
        const documents = await loadCorpus(files, root, corpus);
        if (documents.length > 0) {
            validateDocumentCollection(documents);
            return { documents: documents.sort(compareDocuments), assetRoot: corpus.assetRoot };
        }
    }
    return { documents: [], assetRoot: exampleCorpus.assetRoot };
}

export function sourcePlace(
    root: string,
    library: OculusLibrary,
    sourceFile: string,
    page: number
): Place & { page: number } {
    return { root, path: `${library.assetRoot}/${sourceFile}`, page };
}

async function loadCorpus(
    files: LibraryFiles,
    root: string,
    corpus: Corpus
): Promise<OfficiumDocument[]> {
    const definitions = await findDefinitions(files, root, corpus.documentRoot);
    const documents: OfficiumDocument[] = [];
    for (const definition of definitions) {
        const source = await readText(files, root, definition.path);
        const document =
            definition.directory === null
                ? parseDocument(source, definition.path)
                : parseDocumentParts(
                      source,
                      await readSections(
                          files,
                          root,
                          definition.directory,
                          source,
                          definition.path
                      ),
                      definition.path
                  );
        await requireSource(
            files,
            root,
            `${corpus.assetRoot}/${document.source.file}`,
            definition.path
        );
        await attachImageUrls(document, (file) =>
            imageUrl(files, root, `${corpus.assetRoot}/${file}`)
        );
        documents.push(document);
    }
    return documents;
}

async function findDefinitions(
    files: LibraryFiles,
    root: string,
    directory: string
): Promise<Definition[]> {
    const entries = await listDirectory(files, root, directory);
    if (entries === null) {
        return [];
    }
    if (entries.some(([name, type]) => name === 'document.yaml' && isType(type, fileType))) {
        return [{ path: `${directory}/document.yaml`, directory }];
    }
    const found: Definition[] = [];
    for (const [name, type] of entries) {
        const path = `${directory}/${name}`;
        if (isType(type, folderType)) {
            found.push(...(await findDefinitions(files, root, path)));
        } else if (isType(type, fileType) && /\.ya?ml$/i.test(name)) {
            found.push({ path, directory: null });
        }
    }
    return found.sort((left, right) => left.path.localeCompare(right.path));
}

async function readSections(
    files: LibraryFiles,
    root: string,
    directory: string,
    manifestSource: string,
    manifestPath: string
): Promise<{ source: string; path: string }[]> {
    const sections: { source: string; path: string }[] = [];
    for (const name of listedSectionNames(manifestSource, manifestPath)) {
        const path = `${directory}/${name}`;
        sections.push({ source: await readText(files, root, path), path });
    }
    return sections;
}

async function listDirectory(
    files: LibraryFiles,
    root: string,
    path: string
): Promise<[string, number][] | null> {
    try {
        return await files.readDirectory({ root, path });
    } catch (word) {
        if (word === 'missing') {
            return null;
        }
        throw new Error(`${path}: ${String(word)}`, { cause: word });
    }
}

async function requireSource(
    files: LibraryFiles,
    root: string,
    path: string,
    documentPath: string
): Promise<void> {
    try {
        await files.stat({ root, path });
    } catch (word) {
        if (word === 'missing') {
            throw new Error(`${documentPath}: source.file: file does not exist: ${path}`, {
                cause: word
            });
        }
        throw new Error(`${path}: ${String(word)}`, { cause: word });
    }
}

async function readBytes(files: LibraryFiles, root: string, path: string): Promise<Uint8Array> {
    try {
        return await files.readFile({ root, path });
    } catch (word) {
        throw new Error(`${path}: ${String(word)}`, { cause: word });
    }
}

async function readText(files: LibraryFiles, root: string, path: string): Promise<string> {
    return new TextDecoder().decode(await readBytes(files, root, path));
}

async function imageUrl(files: LibraryFiles, root: string, path: string): Promise<string> {
    const bytes = await readBytes(files, root, path);
    return `data:${imageMimeType(path)};base64,${base64(bytes)}`;
}

function base64(bytes: Uint8Array): string {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
}

function isType(type: number, expected: number): boolean {
    return type === expected;
}
