// Debug-only test for diagnosing rowGroupStyle console output.
// Excluded from normal and CI test runs via testIgnore in playwright configs.
import { test, expect } from '@playwright/test';

test('debug rowGroupStyle counts', async ({ page }) => {
  const rowGroupMessages: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[rowGroupStyle]')) {
      rowGroupMessages.push(text);
    }
  });

  await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Click the Duplicates/Matches venn diagram button
  const matchesButton = page.locator('.data-venn-matches .count-button.left');
  await expect(matchesButton).toBeVisible({ timeout: 10000 });
  await matchesButton.click();
  await page.waitForTimeout(5000);

  // Print all rowGroupStyle messages
  console.log(`\n=== rowGroupStyle messages (${rowGroupMessages.length}) ===`);
  for (const msg of rowGroupMessages) {
    console.log(msg);
  }
  console.log('=== END ===\n');

  expect(rowGroupMessages.length).toBeGreaterThan(0);
});
