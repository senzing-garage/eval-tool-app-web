import { test, expect } from '@playwright/test';
import { getEntityIdByRecordId } from '../helpers/grpc';

test.describe('Graph - Entity (Robert Smith)', () => {
  let entityId: number;

  test.beforeAll(async () => {
    entityId = await getEntityIdByRecordId('CUSTOMERS', '1001');
  });

  test('loads graph page with nodes and link labels', async ({ page }) => {
    await page.goto(`/graph/${entityId}`);
    await page.waitForLoadState('networkidle');

    // Verify route
    expect(page.url()).toContain(`/graph/${entityId}`);

    // Graph components visible
    await expect(page.locator('app-graph')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('sz-standalone-graph')).toBeVisible({ timeout: 10000 });

    // Right-rail tabs exist
    await expect(page.locator('button.tab', { hasText: 'details' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button.tab', { hasText: 'filters' })).toBeVisible({ timeout: 5000 });

    // Graph nodes render (auto-retries until at least one appears)
    const nodes = page.locator('.sz-graph-node');
    await expect(nodes.first()).toBeVisible({ timeout: 15000 });

    // Link labels render with match key text (auto-retries).
    // textPath elements are hidden until the referenced SVG path has non-zero
    // length, which depends on D3 force-layout node positioning. Check that the
    // elements are attached and contain text rather than asserting visibility.
    const linkLabels = page.locator('.sz-graph-link-label textPath');
    await expect(linkLabels.first()).toBeAttached({ timeout: 15000 });
    await expect(linkLabels.first()).not.toBeEmpty();
  });
});
