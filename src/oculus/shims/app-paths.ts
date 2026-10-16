export function resolve(route: string, params: Record<string, string>): string {
    return route.replace(/\[(\w+)\]/g, (_match, name: string) => encodeURIComponent(params[name]));
}
