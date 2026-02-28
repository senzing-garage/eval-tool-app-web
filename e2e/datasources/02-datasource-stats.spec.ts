import { test, expect } from '@playwright/test';

test.describe('Datasource Statistics', () => {
  test('displays stats on existing datasource cards', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('/datasources');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find existing datasource cards
    const cards = page.locator('sz-data-source-card');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} datasource cards`);

    expect(cardCount).toBeGreaterThan(0);

    // Check each card for stats and delete button state
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const title = await card.locator('mat-card-title').textContent();
      console.log(`Card ${i}: ${title}`);

      const recordCount = card.locator('.record-count');
      if (await recordCount.isVisible()) {
        const countText = await recordCount.textContent();
        console.log(`  Stats: ${countText}`);

        // Check if delete button is visible but disabled when records exist
        const deleteButton = card.locator('button.bottom-right-button');
        const deleteButtonCount = await deleteButton.count();
        expect(deleteButtonCount).toBeGreaterThan(0);

        const isDisabled = await deleteButton.isDisabled();
        console.log(`  Delete button disabled: ${isDisabled}`);
        // Cards with records should have delete button disabled
        expect(isDisabled).toBe(true);
      }
    }

    // Print console for debugging
    console.log('\n--- Console Messages ---');
    consoleMessages.filter(m => m.type === 'log').forEach(m => {
      console.log(m.text);
    });
  });
});
