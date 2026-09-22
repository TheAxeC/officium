import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import type { TextCatalog } from '$lib/data/text';
import { validateTextCatalog } from '$lib/data/text';

export function loadTextCatalog(projectRoot = process.cwd()): TextCatalog {
    const sourcePath = resolve(projectRoot, 'config/text.yml');
    return validateTextCatalog(parse(readFileSync(sourcePath, 'utf8')), sourcePath);
}
