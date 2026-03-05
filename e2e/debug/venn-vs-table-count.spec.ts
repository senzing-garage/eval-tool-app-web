import { test, expect } from '@playwright/test';

/** Wait for the data table to finish loading */
async function waitForTableLoad(table: import('@playwright/test').Locator) {
  try {
    await expect(table).toHaveClass(/loading/, { timeout: 3_000 });
  } catch { /* already loaded */ }
  await expect(table).not.toHaveClass(/loading/, { timeout: 30_000 });
  await expect(table.locator('tbody.row-group').first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Venn count matches table row group count', () => {

  const statTypes = [
    { route: 'matches',              vennWrapper: '.venn-wrapper.matches',       label: 'Duplicates' },
    { route: 'ambiguous',            vennWrapper: '.venn-wrapper.ambiguous',     label: 'Ambiguous Matches' },
    { route: 'possible-matches',     vennWrapper: '.venn-wrapper.possibles',     label: 'Possible Duplicates' },
    { route: 'possible-relations',   vennWrapper: '.venn-wrapper.relationships', label: 'Possibly Related' },
    { route: 'disclosed-relations',  vennWrapper: '.venn-wrapper.disclosed',     label: 'Disclosed Relationships' },
  ];

  for (const { route, vennWrapper, label } of statTypes) {
    test(`${label}: venn count matches table group count`, async ({ page }) => {
      await page.goto(`/review/CUSTOMERS/${route}`);
      await page.waitForLoadState('networkidle');

      const summary = page.locator('sz-cross-source-summary');
      await expect(summary).toBeVisible({ timeout: 30_000 });

      // Get the venn count
      const countButton = summary.locator(`${vennWrapper} sz-venn-diagram button.count-button.left`);
      await expect(countButton).toBeVisible({ timeout: 15_000 });
      const vennText = (await countButton.innerText()).trim();
      const vennCount = parseInt(vennText, 10);
      console.log(`${label}: venn count = ${vennCount}`);

      if (vennCount === 0) {
        console.log(`${label}: skipped (0 count)`);
        return;
      }

      // Wait for table to load
      const table = page.locator('sz-cross-source-results');
      await expect(table).toBeVisible({ timeout: 60_000 });
      await waitForTableLoad(table);

      const groupCount = await table.locator('tbody.row-group').count();
      console.log(`${label}: table groups = ${groupCount}`);
      console.log(`${label}: ${vennCount === groupCount ? 'MATCH' : `MISMATCH (venn=${vennCount}, table=${groupCount})`}`);

      expect(groupCount, `${label}: expected table groups to match venn count`).toEqual(vennCount);
    });
  }
});
