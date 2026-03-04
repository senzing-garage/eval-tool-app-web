import { test, expect } from '@playwright/test';

/**
 * Debug test: Deselecting the "vs" datasource via [NONE] in the pulldown
 * should update the report title from cross-source to single-source view.
 */
test.describe('Review Page - Deselect VS', () => {

  test('selecting [NONE] updates the report title', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to a cross-source review page
    await page.goto('/review/WATCHLIST/vs/CUSTOMERS/matches');
    await page.waitForLoadState('networkidle');

    // Wait for the data table to load
    const dataTable = page.locator('sz-cross-source-results');
    await expect(dataTable).toBeVisible({ timeout: 30000 });

    // The title should show the cross-source view
    const title = page.locator('.report-header .title');
    await expect(title).toBeVisible({ timeout: 10000 });
    const initialTitle = await title.innerText();
    console.log('Initial title:', initialTitle);
    expect(initialTitle).toMatch(/WATCHLIST.*CUSTOMERS|CUSTOMERS.*WATCHLIST/i);

    // Find the "B" (to) pulldown and click it
    const toPulldown = page.locator('.dsrc-select.to-dsrc button.dsrc-select').first();
    await toPulldown.click();

    // Click [NONE] in the menu
    const noneOption = page.locator('.data-source-menu button').filter({ hasText: '[ NONE ]' });
    await expect(noneOption).toBeVisible({ timeout: 5000 });
    const isDisabled = await noneOption.isDisabled();
    console.log('[NONE] button disabled:', isDisabled);
    await noneOption.click();

    // Wait a moment for setTimeout in setToDataSource
    await page.waitForTimeout(1000);

    // Check console logs for the datasource change
    const dsLogs = consoleLogs.filter(l => l.includes('to datasource'));
    console.log('DS change logs:', dsLogs);

    // Wait for the pulldown to show [NONE]
    await expect(toPulldown.locator('label')).toHaveText('[ NONE ]', { timeout: 10000 });

    // Now click on the venn diagram "matches" section to trigger a new sample set
    // with the updated datasource selection
    const matchesSection = page.locator('sz-cross-source-summary .matches, sz-cross-source-summary [class*="match"]').first();
    if (await matchesSection.isVisible()) {
      await matchesSection.click();
      await page.waitForLoadState('networkidle');
    }

    // The title should update to single-source view (no more "to CUSTOMERS")
    await expect(title).not.toContainText(/CUSTOMERS/i, { timeout: 10000 });

    console.log('--- Console Logs ---');
    consoleLogs.filter(l =>
      l.includes('to datasource') ||
      l.includes('from datasource') ||
      l.includes('onDefaultToSourceSelected') ||
      l.includes('onSourceStatClicked')
    ).forEach(l => console.log(l));
  });
});
