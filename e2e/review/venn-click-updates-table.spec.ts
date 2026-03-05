import { test, expect } from '@playwright/test';

/** Wait for the data table to finish loading by watching the .loading class */
async function waitForTableLoad(table: import('@playwright/test').Locator) {
  // Wait for loading to start (may already be loading)
  try {
    await expect(table).toHaveClass(/loading/, { timeout: 3_000 });
  } catch {
    // Already finished loading before we checked
  }
  // Wait for loading to finish
  await expect(table).not.toHaveClass(/loading/, { timeout: 30_000 });
  // Wait for at least one row to render
  await expect(table.locator('tbody.row-group').first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Venn Diagram Click Updates Table', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/review/CUSTOMERS/matches');
    await page.waitForLoadState('networkidle');

    const summary = page.locator('sz-cross-source-summary');
    await expect(summary).toBeVisible({ timeout: 30_000 });
    await expect(summary.locator('sz-venn-diagram').first()).toBeVisible({ timeout: 15_000 });

    const table = page.locator('sz-cross-source-results');
    await waitForTableLoad(table);
  });

  test('clicking each venn diagram changes the table title and row count', async ({ page }) => {
    const summary = page.locator('sz-cross-source-summary');
    const title = page.locator('.report-header .title');
    const table = page.locator('sz-cross-source-results');

    // All 5 stat types in singular mode
    const diagrams = [
      { wrapper: '.venn-wrapper.matches',       label: 'Duplicates' },
      { wrapper: '.venn-wrapper.ambiguous',      label: 'Ambiguous Matches' },
      { wrapper: '.venn-wrapper.possibles',      label: 'Possible Duplicates' },
      { wrapper: '.venn-wrapper.relationships',  label: 'Possibly Related' },
      { wrapper: '.venn-wrapper.disclosed',      label: 'Disclosed Relationships' },
    ];

    // Record initial state
    await expect(title).toBeVisible({ timeout: 10_000 });
    const initialTitle = await title.innerText();
    const initialRowCount = await table.locator('tbody.row-group').count();
    console.log(`Initial: title="${initialTitle}", rows=${initialRowCount}`);

    let previousTitle = initialTitle;

    // Click each diagram in turn (skip the first since we're already showing it)
    for (let i = 1; i < diagrams.length; i++) {
      const { wrapper, label } = diagrams[i];
      const button = summary.locator(`${wrapper} sz-venn-diagram button.count-button.left`);

      // Skip if the count is zero (disabled)
      const isDisabled = await button.isDisabled();
      if (isDisabled) {
        console.log(`${label}: skipped (0 count)`);
        continue;
      }

      await button.click();

      // Wait for title to change
      await expect(title).not.toHaveText(previousTitle, { timeout: 30_000 });

      // Wait for the table to fully reload
      await waitForTableLoad(table);

      const currentTitle = await title.innerText();
      const rowCount = await table.locator('tbody.row-group').count();
      console.log(`${label}: title="${currentTitle}", rows=${rowCount}`);

      expect(currentTitle).not.toEqual(previousTitle);
      expect(rowCount).toBeGreaterThan(0);

      previousTitle = currentTitle;
    }

    // Click back on Duplicates
    const matchesButton = summary.locator(`${diagrams[0].wrapper} sz-venn-diagram button.count-button.left`);
    await matchesButton.click();

    await expect(title).not.toHaveText(previousTitle, { timeout: 30_000 });
    await waitForTableLoad(table);

    const finalTitle = await title.innerText();
    const finalRowCount = await table.locator('tbody.row-group').count();
    console.log(`Back to Duplicates: title="${finalTitle}", rows=${finalRowCount}`);

    expect(finalTitle).toEqual(initialTitle);
    expect(finalRowCount).toBeGreaterThan(0);
  });
});
