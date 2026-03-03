import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Debug test for card state progression during load.
 * Imports a single truthset file and tracks the card through:
 *   registering → processing → resolving → completed
 *
 * Requires a fresh gRPC server (no existing data).
 *
 * Run with:  npx playwright test --config=playwright.debug.config.ts -g "card state"
 */

test.describe('Load Card State Progression', () => {
  test.setTimeout(300000); // 5 minutes for large datasets

  test('card transitions through resolving state before completed', async ({ page }) => {
    const consoleMessages: { type: string; text: string; ts: number }[] = [];
    const startTime = Date.now();

    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text(), ts: Date.now() - startTime });
    });
    page.on('pageerror', (err) => {
      consoleMessages.push({ type: 'pageerror', text: err.message, ts: Date.now() - startTime });
    });

    // Navigate to datasources
    await page.goto('/datasources');
    await page.waitForLoadState('networkidle');

    // Click "Add Data Source" to open the file picker
    const addCard = page.locator('mat-card-title', { hasText: 'Add Data Source' });
    await expect(addCard).toBeVisible({ timeout: 10000 });

    const fileInput = page.locator('input[type="file"]');
    const tmpDir = path.join(__dirname, '..', 'data', 'tmp');
    const testFile = path.join(tmpDir, 'loadtest-5K-fixed.jsonl');

    await addCard.click();
    await fileInput.setInputFiles([testFile]);

    // Wait for the Load button to appear (file parsed)
    const loadButton = page.locator('button.action-button-edit-load');
    await expect(loadButton).toHaveCount(1, { timeout: 15000 });
    console.log('Load button visible');

    // Click Load
    await loadButton.click();

    // Dismiss confirmation dialog if it appears (existing datasource)
    const dialogOk = page.locator('.cdk-overlay-container button.dialog-confirm-button');
    if (await dialogOk.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Dismissing confirmation dialog');
      await dialogOk.click();
    }

    // Track card state changes
    const card = page.locator('sz-data-source-card').first();
    const statesObserved = new Set<string>();

    // Poll the card's class list to track state transitions
    const pollStates = async (durationMs: number) => {
      const deadline = Date.now() + durationMs;
      while (Date.now() < deadline) {
        const classes = await card.getAttribute('class').catch(() => '');
        if (classes) {
          for (const cls of ['registering', 'processing', 'resolving', 'preparing-to-resolve', 'loaded']) {
            if (classes.includes(cls) && !statesObserved.has(cls)) {
              statesObserved.add(cls);
              console.log(`[${Date.now() - startTime}ms] Card entered state: ${cls}`);
            }
          }
        }
        await page.waitForTimeout(200);
      }
    };

    // Watch for state transitions for up to 4 minutes (5K records take time)
    console.log('Watching card state transitions...');
    const loaded = page.locator('sz-data-source-card.loaded');

    // Poll until loaded or timeout
    const watchDeadline = Date.now() + 240000;
    while (Date.now() < watchDeadline) {
      const classes = await card.getAttribute('class').catch(() => '');
      if (classes) {
        for (const cls of ['registering', 'processing', 'resolving', 'preparing-to-resolve', 'loaded']) {
          if (classes.includes(cls) && !statesObserved.has(cls)) {
            statesObserved.add(cls);
            console.log(`[${Date.now() - startTime}ms] Card entered state: ${cls}`);
          }
        }
        if (classes.includes('loaded')) break;
      }
      await page.waitForTimeout(300);
    }

    console.log(`\nStates observed: ${[...statesObserved].join(' → ')}`);

    // Print resolution-related console messages
    console.log('\n--- Resolution Console Messages ---');
    consoleMessages
      .filter(m => m.text.includes('Resolution') || m.text.includes('addRecords'))
      .forEach(m => console.log(`[${m.ts}ms] ${m.text}`));

    // Verify the card reached 'loaded' (completed)
    expect(statesObserved.has('loaded'), 'Card should reach loaded state').toBe(true);

    // Verify the card passed through 'resolving' state
    expect(statesObserved.has('resolving'), 'Card should pass through resolving state').toBe(true);

    // Verify the Review button is now visible
    const reviewButton = page.locator('button.action-button-edit-review');
    await expect(reviewButton).toBeVisible({ timeout: 5000 });
    console.log('Review button visible — card fully resolved');
  });
});
