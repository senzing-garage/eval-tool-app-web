import { test, expect } from '@playwright/test';

/** Wait for the data table to finish loading */
async function waitForTableLoad(table: import('@playwright/test').Locator) {
  try {
    await expect(table).toHaveClass(/loading/, { timeout: 3_000 });
  } catch { /* already loaded */ }
  await expect(table).not.toHaveClass(/loading/, { timeout: 30_000 });
  await expect(table.locator('tbody.row-group').first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Entity ID rowspan debug', () => {

  test('check entity ID cell spans vs visible rows on possible-relations', async ({ page }) => {
    await page.goto('/review/CUSTOMERS/vs/WATCHLIST/possible-relations');
    await page.waitForLoadState('networkidle');

    const table = page.locator('sz-cross-source-results');
    await expect(table).toBeVisible({ timeout: 60_000 });
    await waitForTableLoad(table);

    const groups = table.locator('tbody.row-group');
    const groupCount = await groups.count();
    console.log(`Total row groups: ${groupCount}`);

    let mismatches = 0;
    for (let i = 0; i < Math.min(groupCount, 10); i++) {
      const group = groups.nth(i);

      // Get CSS custom property values
      const style = await group.getAttribute('style');
      const entityRowCount = style?.match(/--selected-datasources-entity-row-count:\s*(\d+)/)?.[1];
      const relatedRowCount = style?.match(/--selected-datasources-related-row-count:\s*(\d+)/)?.[1];

      // Count visible entity rows (data-source-selected)
      const visibleEntityRows = await group.locator('tr.row-entity-record.data-source-selected').count();
      const visibleRelatedRows = await group.locator('tr.row-related-record.data-source-selected').count();
      const hiddenEntityRows = await group.locator('tr.row-entity-record.data-source-not-selected').count();
      const hiddenRelatedRows = await group.locator('tr.row-related-record.data-source-not-selected').count();

      const entityMatch = String(visibleEntityRows) === entityRowCount;
      const relatedMatch = String(visibleRelatedRows) === relatedRowCount;

      console.log(`Group ${i}: entity-span=${entityRowCount} visible=${visibleEntityRows} hidden=${hiddenEntityRows} ${entityMatch ? 'OK' : 'MISMATCH'} | related-span=${relatedRowCount} visible=${visibleRelatedRows} hidden=${hiddenRelatedRows} ${relatedMatch ? 'OK' : 'MISMATCH'}`);

      if (!entityMatch || !relatedMatch) mismatches++;
    }

    expect(mismatches, 'Some groups have Entity ID span/visibility mismatches').toBe(0);
  });
});
