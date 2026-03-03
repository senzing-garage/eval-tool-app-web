import { test, expect } from '@playwright/test';

const GRPC_PORT = process.env['GRPC_PORT'] ?? '8261';

test.describe('Overview spinner', () => {
  test('shows initializing spinner then hides after components load', async ({ page }) => {
    // Delay gRPC/data-mart responses so the spinner stays visible long enough to assert on
    await page.route(`**:${GRPC_PORT}/**`, async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });

    await page.goto('/overview', { waitUntil: 'commit' });

    const overlay = page.locator('app-spinner .mat-background');
    const label = page.locator('app-spinner .spinner-label');

    // Spinner overlay should be visible with "Initializing" label
    await expect(overlay).toBeVisible({ timeout: 15000 });
    await expect(label).toHaveText('Initializing');

    // Spinner should disappear once all components have initialized
    await expect(overlay).not.toBeVisible({ timeout: 60000 });

    // Verify the overview content is present
    await expect(page.locator('app-overview')).toBeVisible();
    await expect(page.locator('sz-record-counts-donut')).toBeVisible();
    await expect(page.locator('sz-license')).toBeVisible();
    await expect(page.locator('sz-cross-source-select')).toBeVisible();
    await expect(page.locator('sz-cross-source-summary')).toBeVisible();
  });

  test('does not show spinner on subsequent visits', async ({ page }) => {
    // First visit — wait for initialization to complete
    await page.goto('/overview');
    const overlay = page.locator('app-spinner .mat-background');
    await expect(overlay).not.toBeVisible({ timeout: 30000 });

    // Navigate away
    await page.goto('/settings');
    await expect(page.locator('app-settings')).toBeVisible();

    // Navigate back — spinner should NOT appear
    await page.goto('/overview');
    await expect(page.locator('app-overview')).toBeVisible();
    await expect(overlay).not.toBeVisible({ timeout: 5000 });
  });
});
