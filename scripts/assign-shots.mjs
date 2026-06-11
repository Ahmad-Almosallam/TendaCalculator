// Visual check for the assignment-step edits: masonry layout, multi-select bulk assign,
// and per-person "Done" collapse. Dev server must be running on :5173.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const fixtureSrc = readFileSync(new URL('../src/fixtures/sampleOrder.ts', import.meta.url), 'utf8');
const realOrder = fixtureSrc.match(/realOrder = `([\s\S]*?)`;/)[1];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.removeItem('tenda-calculator-v1'));
await page.reload({ waitUntil: 'networkidle' });

// step 1
await page.getByPlaceholder(/Product Name/).fill(realOrder);
await page.getByRole('button', { name: /Parse order/ }).click();
await page.getByText('Check these before continuing').waitFor();
await page.getByRole('button', { name: /Next/ }).click();

// people
for (const name of ['Ahmad', 'Khaled', 'Sara']) {
  await page.getByPlaceholder('Person name').fill(name);
  await page.getByPlaceholder('Person name').press('Enter');
}

// multi-select: tick the first 5 unassigned cards, then bulk-assign to Khaled
const checks = page.locator('.unit-card .ant-checkbox-input');
for (let i = 0; i < 5; i++) await checks.nth(i).check();
await page.locator('.selection-bar').screenshot({ path: 'scripts/shot-selection-bar.png' });
await page.locator('.selection-bar').getByRole('button', { name: /Khaled/ }).click();

// assign the rest split: 4 more to Ahmad, then collapse Khaled with Done
for (let i = 0; i < 4; i++) await checks.nth(i).check();
await page.locator('.selection-bar').getByRole('button', { name: /Ahmad/ }).click();

// collapse Khaled
await page
  .locator('.ant-card', { hasText: 'Khaled' })
  .getByRole('button', { name: 'Done' })
  .click();
await page.waitForTimeout(300);

await page.screenshot({ path: 'scripts/shot-assign-desktop-new.png', fullPage: true });

// mobile view
await page.setViewportSize({ width: 390, height: 900 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'scripts/shot-assign-mobile-new.png', fullPage: true });

await browser.close();
console.log('screenshots written');
