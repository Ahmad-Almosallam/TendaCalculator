// End-to-end smoke test: walks the real order through all 4 wizard steps in a
// mobile-sized browser and screenshots the assignment and results screens.
// Usage: node scripts/smoke.mjs   (dev server must be running on :5173)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const fixtureSrc = readFileSync(new URL('../src/fixtures/sampleOrder.ts', import.meta.url), 'utf8');
const realOrder = fixtureSrc.match(/realOrder = `([\s\S]*?)`;/)[1];
if (!realOrder.includes('\t')) throw new Error('fixture lost its tabs');

const browser = await chromium.launch();
const failures = [];
const must = async (name, fn) => {
  try {
    await fn();
    console.log(`ok  ${name}`);
  } catch (e) {
    failures.push(name);
    console.error(`FAIL ${name}: ${e.message.split('\n')[0]}`);
  }
};

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// fresh state regardless of previous runs
await page.evaluate(() => localStorage.removeItem('tenda-calculator-v1'));
await page.reload({ waitUntil: 'networkidle' });

await must('step 1: paste & parse 32 items + 3 fees', async () => {
  await page.getByPlaceholder(/Product Name/).fill(realOrder);
  await page.getByRole('button', { name: /Parse order/ }).click();
  await page.getByText('Check these before continuing').waitFor({ timeout: 5000 });
  const itemCount = await page
    .locator('.ant-table')
    .first()
    .locator('tbody tr:not(.ant-table-measure-row)')
    .count();
  if (itemCount !== 32) throw new Error(`expected 32 item rows, got ${itemCount}`);
});

await must('step 2: add people', async () => {
  await page.getByRole('button', { name: /Next/ }).click();
  for (const name of ['Ali', 'Omar', 'Sara']) {
    await page.getByPlaceholder('Person name').fill(name);
    await page.getByPlaceholder('Person name').press('Enter');
  }
  await page.getByText('Sara').first().waitFor();
});

await must('step 2: bulk assign to Ali', async () => {
  await page.getByRole('button', { name: /Assign all remaining/ }).click();
  await page.getByRole('menuitem', { name: 'Ali' }).click();
  await page.getByText('All items assigned').waitFor({ timeout: 5000 });
});

await must('step 2: tap-to-assign one unit to Omar via bottom sheet', async () => {
  await page.locator('.unit-card').first().click();
  await page.locator('.ant-drawer').getByRole('button', { name: /Omar/ }).click();
  // Omar's bucket header now reads "1 item · <price>"
  await page.getByText(/1 item ·/).waitFor({ timeout: 5000 });
});

await page.screenshot({ path: 'scripts/screenshot-assign-mobile.png', fullPage: false });

await must('step 3: customs + manual rate', async () => {
  await page.getByRole('button', { name: /Next/ }).click();
  await page.getByText('Customs fee (SAR)').waitFor();
  const numbers = page.locator('.ant-input-number-input');
  await numbers.nth(0).fill('150'); // customs SAR
  await numbers.nth(1).fill('4.5'); // manual EUR->SAR rate
  await page.getByText('Manual rate in use').waitFor({ timeout: 5000 });
});

await must('step 4: calculate, verification row green', async () => {
  await page.getByRole('button', { name: /Calculate/ }).click();
  await page.getByText(/^Verified: the 3 shares sum exactly/).waitFor({ timeout: 5000 });
});

await must('state survives reload', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText(/^Verified: the 3 shares sum exactly/).waitFor({ timeout: 5000 });
});

await page.screenshot({ path: 'scripts/screenshot-results-mobile.png', fullPage: true });

// desktop view of the assignment board — resize the same page so state carries over
await page.setViewportSize({ width: 1280, height: 800 });
await page.getByRole('button', { name: /Back/ }).click(); // results -> customs
await page.getByRole('button', { name: /Back/ }).click(); // customs -> assign
await page.waitForTimeout(400);
await page.screenshot({ path: 'scripts/screenshot-assign-desktop.png', fullPage: false });

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} failure(s): ${failures.join('; ')}`);
  process.exit(1);
}
console.log('\nAll smoke checks passed.');
