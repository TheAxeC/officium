import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findEntryImage } from '$lib/server/catalogue';

const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
};

export const GET: RequestHandler = ({ params }) => {
    const partIndex = Number(params.part);
    const imagePath = Number.isInteger(partIndex)
        ? findEntryImage(params.document, params.entry, partIndex)
        : null;
    if (imagePath === null) {
        error(404, 'Afbeelding niet gevonden.');
    }
    return new Response(readFileSync(imagePath), {
        headers: {
            'content-type': contentTypes[extname(imagePath).toLowerCase()],
            'cache-control': 'private, no-store'
        }
    });
};
