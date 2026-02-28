import { test, expect } from '@playwright/test';

/**
 * Debug test for drag-and-drop file import on the datasources page.
 * Uses inline JSONL content to create a synthetic File via DataTransfer
 * and dispatches drag events onto the card-container drop zone.
 *
 * Run with:  npx playwright test e2e/debug/drag-drop-file.spec.ts
 */

const TEST_JSONL = [
  '{"DATA_SOURCE":"TEST_DND","RECORD_ID":"DND-1","NAME_FULL":"John Smith"}',
  '{"DATA_SOURCE":"TEST_DND","RECORD_ID":"DND-2","NAME_FULL":"Jane Doe"}',
].join('\n');

async function createFileDataTransfer(
  page: import('@playwright/test').Page,
  content: string,
  fileName: string,
  mimeType: string
) {
  return page.evaluateHandle(
    ({ content, name, type }) => {
      const dt = new DataTransfer();
      const file = new File([content], name, { type, lastModified: Date.now() });
      dt.items.add(file);
      return dt;
    },
    { content, name: fileName, type: mimeType }
  );
}

test.describe('Drag and Drop File Import', () => {

  test('drop JSONL file onto datasources page creates pending upload card', async ({ page }) => {
    const pageErrors: Error[] = [];
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));
    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to datasources
    await page.goto('/datasources', { waitUntil: 'networkidle', timeout: 30000 });
    const dataFiles = page.locator('data-files');
    await expect(dataFiles).toBeVisible({ timeout: 10000 });

    // Count cards before drop
    const cardsBefore = await page.locator('sz-data-source-card').count();
    console.log(`Cards before drop: ${cardsBefore}`);

    // Build the DataTransfer with a JSONL file
    const dataTransfer = await createFileDataTransfer(
      page, TEST_JSONL, 'test-dnd.jsonl', 'application/x-jsonlines'
    );

    // Dispatch the full drag event sequence on the drop zone
    const dropZone = '.card-container';
    await page.dispatchEvent(dropZone, 'dragenter', { dataTransfer });
    await page.dispatchEvent(dropZone, 'dragover', { dataTransfer });

    // Verify the overlay appears
    const mask = page.locator('.dnd-mask');
    await expect(mask).toBeVisible({ timeout: 2000 });

    // Drop the file
    await page.dispatchEvent(dropZone, 'drop', { dataTransfer });

    // Verify the overlay disappears
    await expect(mask).not.toBeVisible({ timeout: 2000 });

    // Wait for file analysis to complete — a new card should appear
    const newCard = page.locator('sz-data-source-card');
    await expect(newCard).toHaveCount(cardsBefore + 1, { timeout: 10000 });

    // Print console messages for debugging
    console.log('\n--- Console Messages ---');
    consoleMessages.forEach(m => {
      const prefix = m.type === 'warning' ? 'WARN' : m.type.toUpperCase();
      console.log(`[${prefix}] ${m.text}`);
    });

    // Check for page errors
    if (pageErrors.length > 0) {
      console.log('\n--- Page Errors ---');
      pageErrors.forEach(e => console.log(e.message));
    }
    expect(pageErrors.map(e => e.message)).toEqual([]);

    // Pause so you can inspect the browser
    await page.waitForTimeout(120_000);
  });
});
