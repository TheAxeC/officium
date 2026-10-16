export function ownRootKey(pathname: string): string {
    const segment = pathname.split('/')[2];
    if (segment === undefined || !segment.startsWith('@') || segment.length < 2) {
        throw new Error(`${pathname}: expected an address of the form /apps/@<root>/<name>/<key>/`);
    }
    return decodeURIComponent(segment.slice(1));
}
