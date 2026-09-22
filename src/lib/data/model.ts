export type SourcePage = {
    pdfPage: number;
    printedPage?: string;
};

export type DocumentSource = {
    file: string;
};

export type Role = {
    id: string;
    label: string;
};

type EntryBase = {
    id: string;
    text: string;
    content: RitualContentPart[];
    source: SourcePage;
};

export type RitualTextPart = {
    type: 'text';
    text: string;
};

export type RitualImagePart = {
    type: 'image';
    file: string;
    alt: string;
    display: 'inline' | 'block';
    runtimeUrl?: string;
};

export type RitualContentPart = RitualTextPart | RitualImagePart;

export type SpeechEntry = EntryBase & {
    kind: 'speech';
    speaker: string;
};

export type ActionEntry = EntryBase & {
    kind: 'action';
    roles: string[];
};

export type ContextEntry = EntryBase & {
    kind: 'direction' | 'text';
};

export type RitualEntry = SpeechEntry | ActionEntry | ContextEntry;

export type RitualSection = {
    id: string;
    title: string;
    entries: RitualEntry[];
};

export type RitualDocument = {
    schemaVersion: 1;
    id: string;
    order: number;
    documentType: 'ritual';
    title: string;
    language: string;
    source: DocumentSource;
    roles: Role[];
    sections: RitualSection[];
};

export type CatechismPair = {
    id: string;
    kind: 'pair';
    question: string;
    answer?: string;
    answerImage?: string;
    answerImageUrl?: string;
    source: SourcePage;
};

export type CatechismPrompt = {
    id: string;
    kind: 'prompt';
    text: string;
    source: SourcePage;
};

export type CatechismText = {
    id: string;
    kind: 'text';
    text: string;
    source: SourcePage;
};

export type CatechismBlock = CatechismPair | CatechismPrompt | CatechismText;

export type CatechismSection = {
    id: string;
    title: string;
    blocks: CatechismBlock[];
};

export type CatechismDocument = {
    schemaVersion: 1;
    id: string;
    order: number;
    documentType: 'catechism';
    title: string;
    language: string;
    source: DocumentSource;
    sections: CatechismSection[];
};

export type OfficiumDocument = RitualDocument | CatechismDocument;
