import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { parseDocument, parseDocumentParts } from '$lib/data/parse';
import { DocumentValidationError } from '$lib/data/validate';
import type { OfficiumDocument } from '$lib/data/model';
import { compareDocuments, validateDocumentCollection } from '$lib/data/order';

export type LoadedDocument = {
    document: OfficiumDocument;
    sourcePath: string;
    answerImagePaths: Record<string, string>;
    entryImagePaths: Record<string, string>;
};

type Corpus = {
    root: string;
    ritualRoot: string;
};

type DocumentDefinition = {
    documentPath: string;
    sectionPaths: string[];
};

export function loadCatalogue(projectRoot = process.cwd()): LoadedDocument[] {
    const privateCorpus = corpus(projectRoot, 'rituals', 'rituals');
    const privateDocuments = privateCorpus === null ? [] : loadCorpus(privateCorpus);
    const exampleCorpus = corpus(projectRoot, 'examples', 'examples/rituals');
    const loaded =
        privateDocuments.length > 0
            ? privateDocuments
            : exampleCorpus === null
              ? []
              : loadCorpus(exampleCorpus);
    validateDocumentCollection(loaded.map((item) => item.document));
    return loaded.sort((left, right) => compareDocuments(left.document, right.document));
}

export function findDocument(
    documentId: string,
    projectRoot = process.cwd()
): LoadedDocument | null {
    return loadCatalogue(projectRoot).find((item) => item.document.id === documentId) ?? null;
}

export function findAnswerImage(
    documentId: string,
    blockId: string,
    projectRoot = process.cwd()
): string | null {
    const loaded = findDocument(documentId, projectRoot);
    return loaded?.answerImagePaths[blockId] ?? null;
}

export function findEntryImage(
    documentId: string,
    entryId: string,
    partIndex: number,
    projectRoot = process.cwd()
): string | null {
    const loaded = findDocument(documentId, projectRoot);
    return loaded?.entryImagePaths[`${entryId}:${partIndex}`] ?? null;
}

function corpus(projectRoot: string, rootName: string, ritualPath: string): Corpus | null {
    const root = resolve(projectRoot, rootName);
    const ritualRoot = resolve(projectRoot, ritualPath);
    return existsSync(ritualRoot) ? { root, ritualRoot } : null;
}

function loadCorpus(corpusValue: Corpus): LoadedDocument[] {
    return documentDefinitions(corpusValue.ritualRoot).map(({ documentPath, sectionPaths }) => {
        const source = readFileSync(documentPath, 'utf8');
        const displayPath = relative(process.cwd(), documentPath);
        const document =
            sectionPaths.length === 0
                ? parseDocument(source, displayPath)
                : parseDocumentParts(
                      source,
                      sectionPaths.map((path) => ({
                          source: readFileSync(path, 'utf8'),
                          path: relative(process.cwd(), path)
                      })),
                      displayPath
                  );
        const sourcePath = safeSourcePath(corpusValue.root, document.source.file, displayPath);
        const answerImagePaths = Object.fromEntries(
            document.documentType === 'catechism'
                ? document.sections.flatMap((section) =>
                      section.blocks.flatMap((block) =>
                          block.kind === 'pair' && block.answerImage !== undefined
                              ? [
                                    [
                                        block.id,
                                        safeAssetPath(
                                            corpusValue.root,
                                            block.answerImage,
                                            displayPath,
                                            `answer_image for '${block.id}'`
                                        )
                                    ]
                                ]
                              : []
                      )
                  )
                : []
        );
        const entryImagePaths = Object.fromEntries(
            document.documentType === 'ritual'
                ? document.sections.flatMap((section) =>
                      section.entries.flatMap((entry) =>
                          entry.content.flatMap((part, index) =>
                              part.type === 'image'
                                  ? [
                                        [
                                            `${entry.id}:${index}`,
                                            safeAssetPath(
                                                corpusValue.root,
                                                part.file,
                                                displayPath,
                                                `image content for '${entry.id}'`
                                            )
                                        ]
                                    ]
                                  : []
                          )
                      )
                  )
                : []
        );
        return { document, sourcePath, answerImagePaths, entryImagePaths };
    });
}

function documentDefinitions(directory: string): DocumentDefinition[] {
    const entries = readdirSync(directory, { withFileTypes: true });
    const manifest = entries.find((entry) => entry.isFile() && entry.name === 'document.yaml');
    if (manifest !== undefined) {
        const documentPath = join(directory, manifest.name);
        return [{ documentPath, sectionPaths: listedSectionPaths(documentPath, directory) }];
    }
    return entries
        .flatMap((entry) => {
            const entryPath = join(directory, entry.name);
            if (entry.isDirectory()) {
                return documentDefinitions(entryPath);
            }
            return entry.isFile() && /\.ya?ml$/i.test(entry.name)
                ? [{ documentPath: entryPath, sectionPaths: [] }]
                : [];
        })
        .sort((left, right) => left.documentPath.localeCompare(right.documentPath));
}

function listedSectionPaths(documentPath: string, directory: string): string[] {
    let value: unknown;
    try {
        value = parse(readFileSync(documentPath, 'utf8'));
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
        const sectionPath = resolve(directory, section);
        if (!sectionPath.startsWith(`${resolve(directory, 'sections')}${sep}`)) {
            throw new DocumentValidationError(
                documentPath,
                `$.sections[${index}]`,
                'path escapes the sections directory'
            );
        }
        if (!existsSync(sectionPath)) {
            throw new DocumentValidationError(
                documentPath,
                `$.sections[${index}]`,
                `file does not exist: ${section}`
            );
        }
        return sectionPath;
    });
}

function safeSourcePath(corpusRoot: string, sourceFile: string, documentPath: string): string {
    return safeAssetPath(corpusRoot, sourceFile, documentPath, 'source.file');
}

function safeAssetPath(
    corpusRoot: string,
    assetFile: string,
    documentPath: string,
    field: string
): string {
    const resolvedRoot = realpathSync(corpusRoot);
    const candidate = resolve(resolvedRoot, assetFile);
    const insideRoot = candidate === resolvedRoot || candidate.startsWith(`${resolvedRoot}${sep}`);
    if (!insideRoot) {
        throw new Error(`${documentPath}: ${field}: path escapes the corpus root`);
    }
    if (!existsSync(candidate)) {
        throw new Error(`${documentPath}: ${field}: file does not exist: ${assetFile}`);
    }
    const realCandidate = realpathSync(candidate);
    if (!realCandidate.startsWith(`${resolvedRoot}${sep}`)) {
        throw new Error(`${documentPath}: ${field}: resolved path escapes the corpus root`);
    }
    return realCandidate;
}
