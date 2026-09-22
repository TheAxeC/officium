import { readFileSync } from 'node:fs';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findDocument } from '$lib/server/catalogue';

export const GET: RequestHandler = ({ params }) => {
    const loaded = findDocument(params.document);
    if (loaded === null) {
        error(404, 'Bronbestand niet gevonden.');
    }
    return new Response(readFileSync(loaded.sourcePath), {
        headers: {
            'content-type': 'application/pdf',
            'content-disposition': `inline; filename="${loaded.document.id}.pdf"`,
            'cache-control': 'private, no-store'
        }
    });
};
