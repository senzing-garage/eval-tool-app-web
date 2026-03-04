import { test, expect } from '@playwright/test';

/**
 * Debug test: Reproduce the review page spinner issue.
 *
 * When navigating to /review/{datasource}, the spinner shows indefinitely
 * and the data table never loads.
 */
test.describe('Review Page Spinner Debug', () => {

  test('Navigate to /review/CUSTOMERS — table should load', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('/review/CUSTOMERS');
    await page.waitForLoadState('networkidle');

    // The cross-source-statistics component should appear
    const statsComponent = page.locator('sz-cross-source-statistics');
    await expect(statsComponent).toBeVisible({ timeout: 10000 });

    // The global spinner should eventually disappear
    const spinner = page.locator('app-spinner .spinner-overlay');
    await expect(spinner).toBeHidden({ timeout: 30000 });

    // The data table (selector: sz-cross-source-results) should become visible
    const dataTable = page.locator('sz-cross-source-results');
    await expect(dataTable).toBeVisible({ timeout: 30000 });

    // Should have rows in the table
    const rows = dataTable.locator('table tbody tr, .row, mat-row');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });

    // Dump relevant console logs
    console.log('--- Console Logs ---');
    consoleLogs.filter(l =>
      l.includes('onSummaryStatsChanged') ||
      l.includes('onDefaultToSourceSelected') ||
      l.includes('onSampleLoading') ||
      l.includes('ROUTE DATA') ||
      l.includes('createNewSampleSet') ||
      l.includes('dataSource1') ||
      l.includes('getSummaryStatistics')
    ).forEach(l => console.log(l));
    });

  test('Navigate via overview → datasources → review', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Start at overview (typical app entry)
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');

    // Wait for overview to finish initializing
    const spinner = page.locator('app-spinner .spinner-overlay');
    await expect(spinner).toBeHidden({ timeout: 30000 });

    // Navigate to datasources
    await page.goto('/datasources');
    await page.waitForLoadState('networkidle');

    // Now navigate to review (as if clicking review button)
    await page.goto('/review/CUSTOMERS');
    await page.waitForLoadState('networkidle');

    const statsComponent = page.locator('sz-cross-source-statistics');
    await expect(statsComponent).toBeVisible({ timeout: 10000 });

    // Spinner should go away
    await expect(spinner).toBeHidden({ timeout: 30000 });

    // Data table should appear
    const dataTable = page.locator('sz-cross-source-results');
    await expect(dataTable).toBeVisible({ timeout: 30000 });

    console.log('--- Console Logs ---');
    consoleLogs.filter(l =>
      l.includes('onSummaryStatsChanged') ||
      l.includes('onDefaultToSourceSelected') ||
      l.includes('onSampleLoading') ||
      l.includes('ROUTE DATA') ||
      l.includes('createNewSampleSet') ||
      l.includes('dataSource1')
    ).forEach(l => console.log(l));
  });
});
