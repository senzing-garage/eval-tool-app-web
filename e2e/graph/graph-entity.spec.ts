import { test, expect } from '@playwright/test';

test.describe('Graph - Entity /graph/1', () => {
  test('loads graph page for entity 1', async ({ page }) => {
    await page.goto('/graph/1');
    await page.waitForLoadState('networkidle');

    // Verify route
    expect(page.url()).toContain('/graph/1');

    // Graph components visible
    await expect(page.locator('app-graph')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('sz-standalone-graph')).toBeVisible({ timeout: 10000 });

    // Right-rail tabs exist
    await expect(page.locator('button.tab', { hasText: 'details' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button.tab', { hasText: 'filters' })).toBeVisible({ timeout: 5000 });

    // Graph nodes render (auto-retries until at least one appears)
    const nodes = page.locator('.sz-graph-node');
    await expect(nodes.first()).toBeVisible({ timeout: 15000 });

    // Link labels render with match key text (auto-retries)
    const linkLabels = page.locator('.sz-graph-link-label textPath');
    await expect(linkLabels.first()).toBeVisible({ timeout: 15000 });
  });
});
