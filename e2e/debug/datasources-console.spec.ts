import { test, expect } from '@playwright/test';

test('datasources page renders without console errors', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/datasources', { waitUntil: 'networkidle', timeout: 30000 });

  // Verify page rendered
  const dataFiles = page.locator('data-files');
  await expect(dataFiles).toBeVisible({ timeout: 10000 });

  // Verify the "Add Data Source" card is visible
  const addCard = page.locator('mat-card.create-new');
  await expect(addCard).toBeVisible();

  // Verify the help icon is present
  const helpIcon = addCard.locator('.help-icon');
  await expect(helpIcon).toBeVisible();

  // No page errors
  expect(pageErrors.map(e => e.message)).toEqual([]);
});
