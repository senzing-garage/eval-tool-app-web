import { test, expect } from '@playwright/test';

test.describe('Graph - Filters persist after node expansion', () => {
  test('filter panel remains after clicking edge toggle on /graph/1', async ({ page }) => {
    await page.goto('/graph/1');
    await page.waitForLoadState('networkidle');

    // Wait for graph nodes to render
    const graphNodes = page.locator('.sz-graph-node');
    await expect(graphNodes.first()).toBeVisible({ timeout: 15000 });

    // Open filters tab
    const filtersTab = page.locator('button.tab', { hasText: 'filters' });
    await expect(filtersTab).toBeVisible({ timeout: 10000 });
    await filtersTab.click();

    // Verify filter panel content
    await expect(page.locator('h3', { hasText: 'Colors by Source' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.color-box').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3', { hasText: 'Filter by Source' })).toBeVisible({ timeout: 5000 });
    const checkboxes = page.locator('.filters-list input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible({ timeout: 5000 });
    const checkboxCountBefore = await checkboxes.count();

    // Try to find a node with collapsed edges — may not exist for small graphs
    const collapsibleNode = page.locator('.sz-graph-node.has-collapsed-edges').first();
    const hasCollapsible = await collapsibleNode.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCollapsible) {
      // Expand collapsed edges
      await collapsibleNode.hover({ force: true });
      const edgeToggle = collapsibleNode.locator('.sz-graph-icon-edge-toggle');
      await expect(edgeToggle).toBeVisible({ timeout: 5000 });
      await edgeToggle.dispatchEvent('click');
      await page.waitForLoadState('networkidle');

      // Filter panel still visible with more checkboxes after expansion
      await expect(page.locator('h3', { hasText: 'Colors by Source' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('h3', { hasText: 'Filter by Source' })).toBeVisible({ timeout: 5000 });
      const checkboxCountAfter = await checkboxes.count();
      expect(checkboxCountAfter).toBeGreaterThan(checkboxCountBefore);
    } else {
      // No collapsible edges — just verify the filter panel rendered correctly
      expect(checkboxCountBefore).toBeGreaterThan(0);
    }
  });
});
