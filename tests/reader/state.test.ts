import { describe, expect, it } from 'vitest';
import {
    parseReaderState,
    readReaderState,
    readerStateKey,
    serializeReaderState,
    storageStore
} from '$lib/reader/state';

describe('reader state', () => {
    it('restores what serializeReaderState produced', () => {
        const state = {
            documentId: 'demonstration-ritual',
            roleId: 'chair',
            itemId: 'chair-welcome'
        };
        expect(parseReaderState(serializeReaderState(state))).toEqual(state);
    });

    it('accepts null role and item', () => {
        const state = { documentId: 'demonstration-catechism', roleId: null, itemId: null };
        expect(parseReaderState(serializeReaderState(state))).toEqual(state);
    });

    it('rejects a value of another version or shape', () => {
        expect(
            parseReaderState({ version: 2, documentId: 'a', roleId: null, itemId: null })
        ).toBeNull();
        expect(
            parseReaderState({ version: 1, documentId: 3, roleId: null, itemId: null })
        ).toBeNull();
        expect(
            parseReaderState({ version: 1, documentId: 'a', roleId: 1, itemId: null })
        ).toBeNull();
        expect(parseReaderState(null)).toBeNull();
        expect(parseReaderState([])).toBeNull();
    });

    it('keeps the stored form of the browser build', () => {
        const values = new Map<string, string>();
        const storage = {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value)
        } as unknown as Storage;
        const state = { documentId: 'a', roleId: 'r', itemId: 'i' };
        storageStore(storage).write(state);
        expect(JSON.parse(values.get(readerStateKey) ?? 'null')).toEqual({ version: 1, ...state });
        expect(readReaderState(storage)).toEqual(state);
        expect(storageStore(storage).read()).toEqual(state);
    });
});
