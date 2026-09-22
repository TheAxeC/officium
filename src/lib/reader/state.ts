export type ReaderState = {
    documentId: string;
    roleId: string | null;
    itemId: string | null;
};

type StoredReaderState = ReaderState & {
    version: 1;
};

export const readerStateKey = 'officium.reader.v1';

export function readReaderState(storage: Storage): ReaderState | null {
    const raw = storage.getItem(readerStateKey);
    if (raw === null) {
        return null;
    }
    try {
        const value = JSON.parse(raw) as unknown;
        if (!isStoredReaderState(value)) {
            return null;
        }
        return {
            documentId: value.documentId,
            roleId: value.roleId,
            itemId: value.itemId
        };
    } catch {
        return null;
    }
}

export function writeReaderState(storage: Storage, state: ReaderState): void {
    const stored: StoredReaderState = { version: 1, ...state };
    storage.setItem(readerStateKey, JSON.stringify(stored));
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
