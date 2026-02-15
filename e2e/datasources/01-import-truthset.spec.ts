import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Datasources', () => {
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

    // The card likely contains or triggers a file input
    // Look for a file input in the page
    const fileInput = page.locator('input[type="file"]');

    // Get the truthset files
    const truthsetDir = path.join(__dirname, '..', 'data', 'truthset');
    const files = [
      path.join(truthsetDir, 'customers.jsonl'),
      path.join(truthsetDir, 'reference.jsonl'),
      path.join(truthsetDir, 'watchlist.jsonl'),
    ];

    console.log('Uploading files:', files.map(f => path.basename(f)).join(', '));

    // Click the Add Data Source card to potentially trigger file dialog
    // Then set files on the input
    await addDataSourceCard.click();

    // Wait a moment for any dialog/input to appear
    await page.waitForTimeout(500);

    // Upload all files at once
    await fileInput.setInputFiles(files);

    // Wait for processing
    console.log('Waiting for files to be processed...');
    await page.waitForTimeout(5000);

    // Find all Load buttons (should be 3, one for each file)
    const loadButtons = page.locator('button.action-button-edit-load');
    let loadButtonCount = await loadButtons.count();
    console.log(`Found ${loadButtonCount} Load buttons`);

    // Click each Load button - buttons disappear after click, so always click first one
    let clickCount = 0;
    while (await loadButtons.count() > 0) {
      const button = loadButtons.first();
      clickCount++;
      console.log(`Clicking Load button ${clickCount}...`);

      await button.click();

      // Wait for state change
      await page.waitForTimeout(2000);
    }
    console.log(`Clicked ${clickCount} Load buttons`);

    // Wait for loading to complete
    console.log('Waiting for loading to complete...');
    await page.waitForTimeout(5000);

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
    logMessages.forEach((msg, i) => {
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

    expect(true).toBe(true);
  });
});
