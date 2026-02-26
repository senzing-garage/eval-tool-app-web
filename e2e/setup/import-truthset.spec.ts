import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Setup', () => {
  test('import truthset files', async ({ page }) => {
    const consoleMessages: { type: string; text: string; timestamp: number }[] = [];
    const startTime = Date.now();

    // Listen for all console events
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now() - startTime,
      });
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now() - startTime,
      });
    });

    // Navigate to datasources
    console.log('Navigating to /datasources...');
    await page.goto('/datasources');
    await page.waitForLoadState('networkidle');

    // Find the "Add Data Source" card and click it
    console.log('Looking for "Add Data Source" button...');
    const addDataSourceCard = page.locator('mat-card-title', { hasText: 'Add Data Source' });
    await expect(addDataSourceCard).toBeVisible();

    // The card contains a file input
    const fileInput = page.locator('input[type="file"]');

    // Get the truthset files
    const truthsetDir = path.join(__dirname, '..', 'data', 'truthset');
    const files = [
      path.join(truthsetDir, 'customers.jsonl'),
      path.join(truthsetDir, 'reference.jsonl'),
      path.join(truthsetDir, 'watchlist.jsonl'),
    ];

    console.log('Uploading files:', files.map(f => path.basename(f)).join(', '));

    // Click the Add Data Source card to trigger file input
    await addDataSourceCard.click();
    await fileInput.setInputFiles(files);

    // Wait for Load buttons to appear (files parsed and ready)
    console.log('Waiting for files to be processed...');
    const loadButtons = page.locator('button.action-button-edit-load');
    await expect(loadButtons).toHaveCount(3, { timeout: 15000 });
    console.log('Found 3 Load buttons');

    // Helper to dismiss any confirmation dialog
    const dismissDialog = async () => {
      const dialogOk = page.locator('.cdk-overlay-container button.dialog-confirm-button');
      if (await dialogOk.isVisible().catch(() => false)) {
        console.log('Dismissing dialog...');
        await dialogOk.click();
        await dialogOk.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }
    };

    // Click Load buttons one at a time, waiting for each card to start loading
    const loadingOrLoaded = page.locator('sz-data-source-card.processing, sz-data-source-card.loaded, sz-data-source-card.resolving');
    for (let i = 0; i < 3; i++) {
      await dismissDialog();
      console.log(`Clicking Load button ${i + 1}...`);
      await loadButtons.first().click();
      await dismissDialog();
      // Wait for this card to transition out of the "ready to load" state
      await expect(loadingOrLoaded).toHaveCount(i + 1, { timeout: 15000 });
    }

    // Wait for all 3 cards to reach "loaded" status (data.status === 'completed')
    const loadedCards = page.locator('sz-data-source-card.loaded');
    console.log('Waiting for all datasources to finish loading...');
    await expect(loadedCards).toHaveCount(3, { timeout: 90000 });
    console.log('All 3 datasources loaded');

    // Print console output summary
    console.log('\n========== CONSOLE OUTPUT ==========\n');

    const logMessages = consoleMessages.filter(m => m.type === 'log');
    const errorMessages = consoleMessages.filter(m => m.type === 'error' || m.type === 'pageerror');
    const warnMessages = consoleMessages.filter(m => m.type === 'warning');

    console.log(`Total: ${consoleMessages.length} messages`);
    console.log(`  - log: ${logMessages.length}`);
    console.log(`  - error: ${errorMessages.length}`);
    console.log(`  - warning: ${warnMessages.length}`);
    console.log('');

    // Show all log messages
    console.log('--- LOG MESSAGES ---');
    logMessages.forEach((msg) => {
      console.log(`[${msg.timestamp}ms] ${msg.text}`);
    });

    if (errorMessages.length > 0) {
      console.log('\n--- ERRORS ---');
      errorMessages.forEach((msg) => {
        console.log(`[${msg.timestamp}ms] ${msg.text}`);
      });
    }

    if (warnMessages.length > 0) {
      console.log('\n--- WARNINGS ---');
      warnMessages.forEach((msg) => {
        console.log(`[${msg.timestamp}ms] ${msg.text}`);
      });
    }

    console.log('\n=====================================\n');

    // Verify datasource cards appeared after import
    const datasourceCards = page.locator('sz-data-source-collection mat-card');
    await expect(datasourceCards).not.toHaveCount(0, { timeout: 10000 });
    const cardCount = await datasourceCards.count();
    console.log(`Verified ${cardCount} datasource cards after import`);
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });
});
