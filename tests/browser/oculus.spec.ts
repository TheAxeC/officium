import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const origin = 'http://officium.test';
const appPath = '/apps/@officium/officium/0123456789abcdef0123456789abcdef/';
const appRoot = join(process.cwd(), '.oculus/apps/officium');

const lightTokens = {
    '--bg': '#f1f5f9',
    '--panel': '#ffffff',
    '--card': '#f8fafc',
    '--ink': '#0f172a',
    '--muted': '#64748b',
    '--line': '#e2e8f0',
    '--chip': '#f1f5f9',
    '--accent': '#bd5d38',
    '--accent-bg': '#e6d6d2',
    '--c-honey': '#f59e0b',
    '--c-cyan': '#0891b2',
    '--c-red': '#dc2626'
};
const darkTokens = {
    '--bg': '#0b0f14',
    '--panel': '#111820',
    '--card': '#151e27',
    '--ink': '#e6edf3',
    '--muted': '#8b98a5',
    '--line': '#263340',
    '--chip': '#1a2430',
    '--accent': '#e0805a',
    '--accent-bg': '#3a2a24',
    '--c-honey': '#f59e0b',
    '--c-cyan': '#22a6c4',
    '--c-red': '#f87171'
};

const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css'
};

test.beforeAll(() => {
    execFileSync('npm', ['run', 'build:oculus'], { stdio: 'pipe' });
});

test('renders the first library document with its role selector under the oculus policy', async ({
    page
}) => {
    const problems = collectProblems(page);
    await openApp(page, null);
    await expect(page.getByLabel('Document')).toHaveValue('demonstration-ritual');
    await expect(page.getByLabel('Rol')).toBeVisible();
    expect(await page.locator('.document-entry').count()).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.querySelectorAll('script:not([src])').length)).toBe(
        0
    );
    expect(
        await page.evaluate(() => {
            try {
                return typeof localStorage;
            } catch {
                return 'blocked';
            }
        })
    ).toBe('blocked');
    expect(problems).toEqual([]);
});

test('highlights the passages of the selected role', async ({ page }) => {
    await openApp(page, null);
    const contributions = () =>
        page
            .locator('.document-entry.contribution')
            .evaluateAll((entries) => entries.map((entry) => entry.id));
    await page.getByLabel('Rol').selectOption('speaker');
    const speaker = await contributions();
    await page.getByLabel('Rol').selectOption('coordinator');
    const coordinator = await contributions();
    expect(speaker.length).toBeGreaterThan(0);
    expect(coordinator.length).toBeGreaterThan(0);
    expect(coordinator).not.toEqual(speaker);
    await page.getByRole('button', { name: 'Volgende' }).click();
    await expect(page.locator('.document-entry.current')).toHaveCount(1);
});

test('opens the source PDF through the bridge', async ({ page }) => {
    await openApp(page, null);
    const file = { root: 'officium', path: 'examples/sources/demonstration-ritual.pdf' };
    await page.locator('.source-button').first().click();
    await page.locator('.source-button').last().click();
    await expect
        .poll(() =>
            page.evaluate(() => (window as unknown as { __oculus: Control }).__oculus.opened)
        )
        .toEqual([{ file: { ...file, page: 1 } }, { file: { ...file, page: 3 } }]);
});

test('follows the oculus theme whatever the system scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openApp(page, null);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(241, 245, 249)');
    await expect(page.locator('.navigation button').first()).toHaveCSS('color', 'rgb(15, 23, 42)');
    await page.evaluate(() =>
        (window as unknown as { __oculus: Control }).__oculus.setTheme('dark')
    );
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(11, 15, 20)');
    await expect(page.locator('.navigation button').first()).toHaveCSS(
        'color',
        'rgb(230, 237, 243)'
    );
});

test('shows the refusal when the source cannot be opened', async ({ page }) => {
    await openApp(page, null, { open: 'declined' });
    await page.locator('.source-button').first().click();
    await expect(page.getByRole('alert')).toContainText('declined');
});

test('shows the refusal when the reading position cannot be kept', async ({ page }) => {
    await openApp(page, null, { setState: 'too_large' });
    await page.getByLabel('Rol').selectOption('speaker');
    await expect(page.getByRole('alert')).toContainText('too_large');
});

test('shows a library that cannot be read', async ({ page }) => {
    await openApp(page, null, { readDirectory: 'failed:500' });
    await expect(page.locator('.library-screen')).toContainText('rituals: failed:500');
});

test('keeps the reading position in the bridge state', async ({ page }) => {
    await openApp(page, null);
    await page.getByLabel('Rol').selectOption('speaker');
    await page.getByRole('button', { name: 'Volgende' }).click();
    const current = await page.locator('.document-entry.current').getAttribute('id');
    const saved = await page.evaluate(
        () => (window as unknown as { __oculus: Control }).__oculus.state
    );
    expect(saved).toMatchObject({
        version: 1,
        documentId: 'demonstration-ritual',
        roleId: 'speaker'
    });
    await openApp(page, saved);
    await expect(page.getByLabel('Rol')).toHaveValue('speaker');
    await expect(page.locator('.document-entry.current')).toHaveAttribute('id', current!);
});

type Faults = { open?: string; setState?: string; readDirectory?: string };

async function openApp(page: Page, savedState: unknown, faults: Faults = {}): Promise<void> {
    await page.unroute(`${origin}/**`);
    await page.route(`${origin}/**`, async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/apps/-/oculus.js') {
            await route.fulfill({
                status: 200,
                headers: sharedHeaders('text/javascript'),
                body: stubBridge(savedState, faults)
            });
            return;
        }
        if (path.startsWith(appPath)) {
            const file = join(appRoot, path.slice(appPath.length));
            await route.fulfill({
                status: 200,
                headers: appHeaders(contentTypes[extname(file)] ?? 'application/octet-stream'),
                body: readFileSync(file)
            });
            return;
        }
        await route.fulfill({ status: 404, body: '' });
    });
    await page.goto(`${origin}${appPath}index.html`);
    await page.waitForFunction(
        () => (window as unknown as { __oculus?: Control }).__oculus !== undefined
    );
    if (faults.readDirectory === undefined) {
        await expect(page.locator('.app-shell')).toBeVisible();
    }
}

function sharedHeaders(type: string): Record<string, string> {
    return {
        'content-type': type,
        'access-control-allow-origin': '*',
        'x-content-type-options': 'nosniff'
    };
}

function appHeaders(type: string): Record<string, string> {
    const host = 'officium.test';
    const base = `${host}${appPath}`;
    const shared = `${host}/apps/-/`;
    return {
        ...sharedHeaders(type),
        'content-security-policy': [
            'sandbox allow-scripts allow-downloads',
            "default-src 'none'",
            `script-src ${base} ${shared} 'wasm-unsafe-eval'`,
            `style-src ${base} 'unsafe-inline'`,
            `img-src ${base} data:`,
            `font-src ${base}`,
            `media-src ${base}`,
            `connect-src ${base}`,
            "base-uri 'none'",
            "form-action 'none'",
            `frame-ancestors ${host}`
        ].join('; ')
    };
}

function collectProblems(page: Page): string[] {
    const problems: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') problems.push(message.text());
    });
    page.on('pageerror', (error) => problems.push(error.message));
    return problems;
}

function stubBridge(savedState: unknown, faults: Faults): string {
    const files = Object.fromEntries(
        ['demonstration-ritual', 'demonstration-catechism'].map((name) => [
            `examples/rituals/${name}.yaml`,
            readFileSync(`examples/rituals/${name}.yaml`, 'utf8')
        ])
    );
    return `
const files = ${JSON.stringify(files)};
const sources = ['examples/sources/demonstration-ritual.pdf', 'examples/sources/demonstration-catechism.pdf'];
const faults = ${JSON.stringify(faults)};
const themes = { light: ${JSON.stringify(lightTokens)}, dark: ${JSON.stringify(darkTokens)} };
function paint(name) {
    for (const [token, value] of Object.entries(themes[name])) {
        document.documentElement.style.setProperty(token, value);
    }
}
export async function connect() {
    const control = { opened: [], state: ${JSON.stringify(savedState ?? null)}, setTheme: paint };
    window.__oculus = control;
    paint('light');
    return {
        fs: {
            readFile: async ({ path }) => {
                if (!(path in files)) throw 'missing';
                return new TextEncoder().encode(files[path]);
            },
            stat: async ({ path }) => {
                if (!(path in files) && !sources.includes(path)) throw 'missing';
                return {};
            },
            readDirectory: async ({ path }) => {
                if (faults.readDirectory) throw faults.readDirectory;
                const names = new Map();
                for (const file of Object.keys(files)) {
                    if (!file.startsWith(path + '/')) continue;
                    const rest = file.slice(path.length + 1);
                    const slash = rest.indexOf('/');
                    names.set(slash === -1 ? rest : rest.slice(0, slash), slash === -1 ? 1 : 2);
                }
                if (names.size === 0) throw 'missing';
                return [...names.entries()];
            }
        },
        getState: async () => control.state,
        setState: async (value) => {
            if (faults.setState) throw faults.setState;
            control.state = value;
        },
        open: async (target) => {
            if (faults.open) throw faults.open;
            control.opened.push(target);
        }
    };
}
`;
}

type Control = {
    opened: unknown[];
    state: unknown;
    setTheme(name: 'light' | 'dark'): void;
};
