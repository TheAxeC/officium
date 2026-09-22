import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadCatalogue } from '$lib/server/catalogue';

export const GET: RequestHandler = () => {
    return json(loadCatalogue().map((item) => item.document));
};
