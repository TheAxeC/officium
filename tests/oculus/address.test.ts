import { describe, expect, it } from 'vitest';
import { ownRootKey } from '$lib/oculus/address';

describe('oculus app address', () => {
    it('reads the root key of a root app address', () => {
        expect(ownRootKey('/apps/@officium/officium/0123abcd/index.html')).toBe('officium');
    });

    it('decodes a percent-encoded root key', () => {
        expect(ownRootKey('/apps/@my%20folder/officium/0123abcd/index.html')).toBe('my folder');
    });

    it('refuses the address of a machine app', () => {
        expect(() => ownRootKey('/apps/officium/0123abcd/index.html')).toThrow(
            'expected an address'
        );
    });
});
