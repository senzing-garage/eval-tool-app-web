import { test, expect } from '@playwright/test';

test.describe('Setup', () => {
  test('verify data mart has finished processing', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');

    const donut = page.locator('sz-record-counts-donut');
    await expect(donut).toBeVisible();

    // Poll until the data mart reports >= 159 total records.
    // The donut component refreshes every 20 s, so 90 s gives plenty of time.
    await expect(donut).toHaveAttribute('aria-totalrecords', /\d+/, { timeout: 90_000 });

    // Now wait for the count to reach the expected truthset total
    await expect(async () => {
      const value = await donut.getAttribute('aria-totalrecords');
      expect(Number(value)).toBeGreaterThanOrEqual(159);
    }).toPass({ timeout: 90_000, intervals: [2_000] });

    const total = await donut.getAttribute('aria-totalrecords');
    console.log(`Data mart ready — ${total} records processed`);
  });
});
