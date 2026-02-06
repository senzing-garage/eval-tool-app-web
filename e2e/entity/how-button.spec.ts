import { test, expect } from '@playwright/test';

test.describe('Entity Detail - How Button', () => {
  test('how button navigates to how report page', async ({ page }) => {
    const entityId = 1;
    const consoleMessages: { type: string; text: string; timestamp: number }[] = [];
    const startTime = Date.now();

    // Listen for console events
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now() - startTime,
      });
    });

    // Navigate to entity detail page
    console.log(`Navigating to /entity/${entityId}...`);
    await page.goto(`/entity/${entityId}`);
    await page.waitForLoadState('networkidle');

    // Wait for entity detail to load
    await page.waitForTimeout(2000);

    // Find the How Report button
    console.log('Looking for How Report button...');
    const howButton = page.locator('button.detail-header-how-button', { hasText: 'How Report' });

    // Check that the how button exists and is visible
    await expect(howButton).toBeVisible({ timeout: 10000 });
    console.log('How Report button found');

    // Check that the button is not disabled
    const isDisabled = await howButton.isDisabled();
    console.log(`How button disabled: ${isDisabled}`);

    // Click the how button
    console.log('Clicking How Report button...');
    await howButton.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check that we navigated to the how route
    const currentUrl = page.url();
    console.log(`Current URL after click: ${currentUrl}`);

    expect(currentUrl).toContain(`/how/${entityId}`);
    console.log('Successfully navigated to How Report page');

    // Print console messages for debugging
    console.log('\n--- Console Messages ---');
    consoleMessages
      .filter((m) => m.type === 'log' || m.type === 'error')
      .slice(-20)
      .forEach((m) => {
        console.log(`[${m.timestamp}ms] ${m.type}: ${m.text}`);
      });
  });
});
