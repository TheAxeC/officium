import adapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

const desktop = process.env.OFFICIUM_DESKTOP === '1';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: desktop ? staticAdapter({ fallback: 'index.html', strict: false }) : adapter()
    }
};

export default config;
