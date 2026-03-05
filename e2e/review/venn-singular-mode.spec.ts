import { test, expect } from '@playwright/test';

test.describe('Venn Diagram Singular vs Cross-Source Mode', () => {

  test('single source shows singular venn diagrams (one circle each)', async ({ page }) => {
    await page.goto('/review/REFERENCE/matches');
    await page.waitForLoadState('networkidle');

    const summary = page.locator('sz-cross-source-summary');
    await expect(summary).toBeVisible({ timeout: 30_000 });

    const venns = summary.locator('sz-venn-diagram');
    await expect(venns.first()).toBeVisible({ timeout: 15_000 });

    // Each venn diagram should have the singular CSS class
    for (const venn of await venns.all()) {
      await expect(venn).toHaveClass(/singular/);
    }

    // No right circles or overlap elements should exist
    await expect(summary.locator('sz-venn-diagram .right-set')).toHaveCount(0);
    await expect(summary.locator('sz-venn-diagram .overlap-set')).toHaveCount(0);
  });

  test('two sources shows cross-source venn diagrams (two circles each)', async ({ page }) => {
    await page.goto('/review/REFERENCE/vs/CUSTOMERS/matches');
    await page.waitForLoadState('networkidle');

    const summary = page.locator('sz-cross-source-summary');
    await expect(summary).toBeVisible({ timeout: 30_000 });

    const venns = summary.locator('sz-venn-diagram');
    await expect(venns.first()).toBeVisible({ timeout: 15_000 });

    // No venn diagram should have the singular CSS class
    for (const venn of await venns.all()) {
      await expect(venn).not.toHaveClass(/singular/);
    }

    // Right circles and overlap elements should be present
    const vennCount = await venns.count();
    await expect(summary.locator('sz-venn-diagram .right-set')).toHaveCount(vennCount);
    await expect(summary.locator('sz-venn-diagram .overlap-set')).toHaveCount(vennCount);
  });
});
