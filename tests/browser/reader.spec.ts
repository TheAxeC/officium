import { expect, test, type Page } from '@playwright/test';

test('filters ritual contributions while retaining full context', async ({ page }) => {
    await page.goto('/');
    await selectDocument(page, 'ritual');
    await expect(page.getByLabel('Rol')).toBeVisible();
    expect(await page.locator('.navigation li').count()).toBeGreaterThan(0);
    await expect(page.locator('.navigation li small').first()).toHaveText(/^(p\. \S+|PDF \d+)$/);
    expect(await page.locator('.document-entry.contribution').count()).toBeGreaterThan(0);
    await expect(page.locator('.document-entry.speech .entry-kind').first()).toHaveText(
        'Gesproken tekst'
    );
    await expect(page.locator('.document-entry.action .entry-kind').first()).toHaveText(
        'Handeling'
    );
    await expect(page.locator('.document-entry.direction .entry-kind').first()).toHaveText('Regie');
    await page.getByRole('button', { name: 'Volgende' }).click();
    await expect(page.locator('.document-entry.current')).toHaveCount(1);
});

test('uses question navigation for catechisms and opens the source PDF', async ({ page }) => {
    await page.goto('/');
    const documentId = await selectDocument(page, 'catechism');
    await expect(page.getByLabel('Rol')).toHaveCount(0);
    expect(await page.locator('.navigation li').count()).toBeGreaterThan(0);
    await expect(page.locator('.catechism-text')).toHaveCount(1);
    await page.getByRole('button', { name: 'Volgende' }).click();
    const current = page.locator('.catechism-pair.current');
    await expect(current).toHaveCount(1);
    await expect(current.locator('.source-link')).toHaveAttribute(
        'href',
        new RegExp(`^/api/source/${documentId}#page=`)
    );
    const response = await page.request.get(`/api/source/${documentId}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/pdf');
});

test('scrolls the document without moving either navigation bar', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto('/');
    await selectDocument(page, 'ritual');
    const header = page.locator('.app-header');
    const controls = page.locator('.step-controls');
    const reader = page.locator('.reading-pane');
    const before = {
        header: await header.boundingBox(),
        controls: await controls.boundingBox()
    };
    const metrics = await reader.evaluate((element) => {
        element.scrollTo(0, element.scrollHeight);
        return {
            clientHeight: element.clientHeight,
            scrollHeight: element.scrollHeight,
            scrollTop: element.scrollTop
        };
    });
    const after = {
        header: await header.boundingBox(),
        controls: await controls.boundingBox()
    };
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
    expect(metrics.scrollTop).toBeGreaterThan(0);
    expect(after.header?.y).toBe(before.header?.y);
    expect(after.controls?.y).toBe(before.controls?.y);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.locator('.navigation').evaluate((element) => element.scrollTop)).toBe(0);
});

test('opens and closes the contribution outline on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await selectDocument(page, 'catechism');
    const outline = page.locator('.navigation');
    const toggle = page.getByRole('button', { name: 'Vragen' });
    await expect(outline).toBeHidden();
    await toggle.click();
    await expect(outline).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sluiten', exact: true })).toHaveAttribute(
        'aria-expanded',
        'true'
    );
});

test('jumps between semantic ritual sections', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto('/');
    await selectDocument(page, 'ritual');
    const section = page.getByRole('combobox', { name: 'Sectie' });
    await expect(section).toBeVisible();
    const secondSection = await section.locator('option').nth(1).getAttribute('value');
    expect(secondSection).not.toBeNull();
    await section.selectOption(secondSection!);
    await expect(section).toHaveValue(secondSection!);
    await expect(page.locator(`#section-${secondSection}`)).toBeInViewport();
});

async function selectDocument(page: Page, documentType: 'ritual' | 'catechism'): Promise<string> {
    const response = await page.request.get('/api/catalogue');
    expect(response.status()).toBe(200);
    const documents = (await response.json()) as { id: string; documentType: string }[];
    const document = documents.find((candidate) => candidate.documentType === documentType);
    expect(document).toBeDefined();
    const selector = page.getByLabel('Document');
    await selector.selectOption(document!.id);
    return document!.id;
}
