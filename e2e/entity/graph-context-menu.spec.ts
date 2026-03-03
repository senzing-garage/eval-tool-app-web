import { test, expect } from '@playwright/test';
import { getEntityIdByRecordId } from '../helpers/grpc';

test.describe('Entity Detail - Graph Context Menu', () => {
  let entityId: number;

  test.beforeAll(async () => {
    entityId = await getEntityIdByRecordId('CUSTOMERS', '1001');
  });

  test('context menu appears near the right-click location on a graph node', async ({ page }) => {
    await page.goto(`/entity/${entityId}`);
    await page.waitForLoadState('networkidle');

    // Wait for entity detail to render, then for the graph section
    await expect(page.locator('sz-entity-detail-grpc')).toBeVisible({ timeout: 15000 });
    const graphComponent = page.locator('sz-entity-detail-graph');
    await expect(graphComponent).toBeVisible({ timeout: 15000 });

    const isClosed = await graphComponent.evaluate(el => el.classList.contains('closed'));
    if (isClosed) {
      await page.locator('sz-entity-detail-graph .section-header__wrapper').click();
      await page.waitForTimeout(500);
    }

    // Wait for SVG nodes to render
    const svgNode = page.locator('sz-entity-detail-graph .sz-graph-node');
    await expect(svgNode.first()).toBeVisible({ timeout: 15000 });

    // Right-click on the first node
    const nodeBBox = await svgNode.first().boundingBox();
    const clickX = nodeBBox!.x + nodeBBox!.width / 2;
    const clickY = nodeBBox!.y + nodeBBox!.height / 2;
    await page.mouse.click(clickX, clickY, { button: 'right' });

    // Verify the overlay context menu appears
    const menu = page.locator('.cdk-overlay-container .graph-context-menu');
    await expect(menu).toBeVisible({ timeout: 5000 });

    // Verify the menu contains the "Open in new tab" option
    await expect(menu.locator('li', { hasText: 'Open in new tab' })).toBeVisible();

    // Verify the menu is positioned near the click (within 150px)
    const menuBBox = await menu.boundingBox();
    const deltaX = Math.abs(menuBBox!.x - clickX);
    const deltaY = Math.abs(menuBBox!.y - clickY);
    expect(deltaX, `menu X offset ${deltaX}px from click`).toBeLessThan(150);
    expect(deltaY, `menu Y offset ${deltaY}px from click`).toBeLessThan(150);
  });
});
