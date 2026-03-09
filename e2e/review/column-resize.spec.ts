import { test, expect } from '@playwright/test';

test.describe('Column Resize', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/review/REFERENCE/matches');
    await page.waitForLoadState('networkidle');
    const dataTable = page.locator('sz-cross-source-results');
    await expect(dataTable).toBeVisible({ timeout: 30_000 });
    await expect(dataTable.locator('th').first()).toBeVisible({ timeout: 10_000 });
  });

  test('resize indicator aligns with cursor during drag', async ({ page }) => {
    const dataTable = page.locator('sz-cross-source-results');
    const handle = dataTable.locator('.handle-resize').first();
    await expect(handle).toBeAttached({ timeout: 5_000 });

    const handleBox = await handle.boundingBox();
    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    // Drag right
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    const targetX = startX + 80;
    await page.mouse.move(targetX, startY);

    // Indicator should be visible and aligned with cursor
    const indicator = dataTable.locator('.resize-indicator');
    await expect(indicator).toBeVisible({ timeout: 2_000 });

    const indicatorScreenX = await indicator.evaluate(
      el => el.getBoundingClientRect().left
    );
    expect(Math.abs(indicatorScreenX - targetX)).toBeLessThan(10);

    await page.mouse.up();

    // Indicator should disappear after release
    await expect(indicator).not.toBeVisible({ timeout: 2_000 });
  });

  test('column width changes after drag-to-resize', async ({ page }) => {
    const dataTable = page.locator('sz-cross-source-results');

    // Get the first resizable header and its handle
    const firstHandle = dataTable.locator('.handle-resize').first();
    await expect(firstHandle).toBeAttached({ timeout: 5_000 });

    // Get the parent <th> and measure its initial width
    const th = firstHandle.locator('..');
    const initialWidth = await th.evaluate(el => el.getBoundingClientRect().width);

    const handleBox = await firstHandle.boundingBox();
    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    // Drag 100px to the right
    const dragDelta = 100;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dragDelta, startY);
    await page.mouse.up();

    // Column should be wider than before (allow some tolerance)
    const newWidth = await th.evaluate(el => el.getBoundingClientRect().width);
    expect(newWidth).toBeGreaterThan(initialWidth + dragDelta * 0.5);
  });

  test('mouseup outside header disengages resize', async ({ page }) => {
    const dataTable = page.locator('sz-cross-source-results');
    const handle = dataTable.locator('.handle-resize').first();
    await expect(handle).toBeAttached({ timeout: 5_000 });

    const handleBox = await handle.boundingBox();
    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    // Start drag
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY);

    const indicator = dataTable.locator('.resize-indicator');
    await expect(indicator).toBeVisible({ timeout: 2_000 });

    // Move mouse well below the header (into the table body) and release
    await page.mouse.move(startX + 50, startY + 300);
    await page.mouse.up();

    // Resize should be disengaged — indicator hidden
    await expect(indicator).not.toBeVisible({ timeout: 2_000 });

    // Host should not have the column-resizing class
    await expect(dataTable).not.toHaveClass(/column-resizing/);
  });
});
