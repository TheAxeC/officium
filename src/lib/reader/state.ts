export type ReaderState = {
    documentId: string;
    roleId: string | null;
    itemId: string | null;
};

type StoredReaderState = ReaderState & {
    version: 1;
};

export type ReaderStateStore = {
    read(): ReaderState | null;
    write(state: ReaderState): void;
};

export const readerStateKey = 'officium.reader.v1';

export function readReaderState(storage: Storage): ReaderState | null {
    const raw = storage.getItem(readerStateKey);
    if (raw === null) {
        return null;
    }
    try {
        return parseReaderState(JSON.parse(raw));
    } catch {
        return null;
    }
}

export function writeReaderState(storage: Storage, state: ReaderState): void {
    storage.setItem(readerStateKey, JSON.stringify(serializeReaderState(state)));
}

export function parseReaderState(value: unknown): ReaderState | null {
    if (!isStoredReaderState(value)) {
        return null;
    }
    return {
        documentId: value.documentId,
        roleId: value.roleId,
        itemId: value.itemId
    };
}

export function serializeReaderState(state: ReaderState): StoredReaderState {
    return { version: 1, ...state };
}

export function storageStore(storage: Storage): ReaderStateStore {
    return {
        read: () => readReaderState(storage),
        write: (state) => writeReaderState(storage, state)
    };
}

function isStoredReaderState(value: unknown): value is StoredReaderState {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }
    const candidate = value as Record<string, unknown>;
    return (
        candidate.version === 1 &&
        typeof candidate.documentId === 'string' &&
        nullableString(candidate.roleId) &&
        nullableString(candidate.itemId)
    );
}

function nullableString(value: unknown): value is string | null {
    return value === null || typeof value === 'string';
}
