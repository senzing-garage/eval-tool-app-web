import { test, expect } from '@playwright/test';

test.describe('Graph - Filters persist after node expansion', () => {
  test('filter panel remains after clicking edge toggle on /graph/1', async ({ page }) => {
    // Navigate to graph page
    await page.goto('/graph/1');
    await page.waitForLoadState('networkidle');

    // Wait for graph nodes to render (at least the primary node)
    const graphNodes = page.locator('.sz-graph-node');
    await expect(graphNodes.first()).toBeVisible({ timeout: 15000 });

    // Click the filters tab
    const filtersTab = page.locator('button.tab', { hasText: 'filters' });
    await expect(filtersTab).toBeVisible({ timeout: 10000 });
    await filtersTab.click();

    // Assert "Colors by Source" and "Filter by Source" are present
    const colorsHeading = page.locator('h3', { hasText: 'Colors by Source' });
    await expect(colorsHeading).toBeVisible({ timeout: 5000 });
    const colorBoxes = page.locator('.color-box');
    expect(await colorBoxes.count()).toBeGreaterThan(0);

    const filterHeading = page.locator('h3', { hasText: 'Filter by Source' });
    await expect(filterHeading).toBeVisible({ timeout: 5000 });
    const checkboxes = page.locator('.filters-list input[type="checkbox"]');
    const checkboxCountBefore = await checkboxes.count();
    expect(checkboxCountBefore).toBeGreaterThan(0);

    // Wait for a node with collapsed edges to appear (graph may need time to compute relationships)
    const collapsibleNode = page.locator('.sz-graph-node.has-collapsed-edges').first();
    await expect(collapsibleNode).toBeVisible({ timeout: 30000 });

    // Hover to reveal the edge toggle, then click it
    await collapsibleNode.hover({ force: true });
    const edgeToggle = collapsibleNode.locator('.sz-graph-icon-edge-toggle');
    await expect(edgeToggle).toBeVisible({ timeout: 5000 });
    await edgeToggle.dispatchEvent('click');

    // Wait for graph to update with expanded edges
    await page.waitForLoadState('networkidle');

    // Re-assert filter panel persists after expansion
    await expect(colorsHeading).toBeVisible({ timeout: 5000 });
    expect(await colorBoxes.count()).toBeGreaterThan(0);

    await expect(filterHeading).toBeVisible({ timeout: 5000 });
    const checkboxCountAfter = await checkboxes.count();
    expect(checkboxCountAfter).toBeGreaterThan(checkboxCountBefore);
  });
});
