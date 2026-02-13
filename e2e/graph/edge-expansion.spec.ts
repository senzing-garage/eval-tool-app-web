import { test, expect } from '@playwright/test';

test.describe('Graph - Filters persist after node expansion', () => {
  test('filter panel remains after clicking edge toggle on /graph/1', async ({ page }) => {
    const consoleMessages: { type: string; text: string; timestamp: number }[] = [];
    const startTime = Date.now();

    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now() - startTime,
      });
    });

    page.on('pageerror', (error) => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now() - startTime,
      });
    });

    // Navigate to graph page and wait for render
    console.log('Navigating to /graph/1...');
    await page.goto('/graph/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Click the filters tab
    const filtersTab = page.locator('button.tab', { hasText: 'filters' });
    await expect(filtersTab).toBeVisible({ timeout: 10000 });
    await filtersTab.click();
    console.log('Clicked filters tab');
    await page.waitForTimeout(500);

    // Assert "Colors by Source" heading and color boxes
    const colorsHeading = page.locator('h3', { hasText: 'Colors by Source' });
    await expect(colorsHeading).toBeVisible({ timeout: 5000 });
    const colorBoxes = page.locator('.color-box');
    const colorBoxCount = await colorBoxes.count();
    console.log(`Colors by Source: ${colorBoxCount} color boxes`);
    expect(colorBoxCount).toBeGreaterThan(0);

    // Assert "Filter by Source" heading and checkboxes
    const filterHeading = page.locator('h3', { hasText: 'Filter by Source' });
    await expect(filterHeading).toBeVisible({ timeout: 5000 });
    const checkboxes = page.locator('.filters-list input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    console.log(`Filter by Source: ${checkboxCount} checkboxes`);
    expect(checkboxCount).toBeGreaterThan(0);

    // Hover over a node that has collapsible edges to reveal the toggle, then click it
    const collapsibleNode = page.locator('.sz-graph-node.has-collapsed-edges').first();
    await expect(collapsibleNode).toBeAttached({ timeout: 10000 });
    await collapsibleNode.hover({ force: true });
    await page.waitForTimeout(300);
    const edgeToggle = collapsibleNode.locator('.sz-graph-icon-edge-toggle');
    await edgeToggle.dispatchEvent('click');
    console.log('Clicked edge expansion toggle');

    // Wait for graph to update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Re-assert "Colors by Source" heading and color boxes persist
    await expect(colorsHeading).toBeVisible({ timeout: 5000 });
    const colorBoxCountAfter = await colorBoxes.count();
    console.log(`After expansion — Colors by Source: ${colorBoxCountAfter} color boxes`);
    expect(colorBoxCountAfter).toBeGreaterThan(0);

    // Re-assert "Filter by Source" heading and checkboxes persist
    await expect(filterHeading).toBeVisible({ timeout: 5000 });
    const checkboxCountAfter = await checkboxes.count();
    console.log(`After expansion — Filter by Source: ${checkboxCountAfter} checkboxes`);
    expect(checkboxCountAfter).toBeGreaterThan(0);

    // Print console messages for debugging
    console.log('\n--- Console Messages ---');
    consoleMessages
      .filter((m) => m.type === 'log' || m.type === 'error' || m.type === 'pageerror')
      .slice(-30)
      .forEach((m) => {
        console.log(`[${m.timestamp}ms] ${m.type}: ${m.text}`);
      });
  });
});
