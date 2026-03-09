import { test, expect } from '@playwright/test';

test.describe.serial('Search By ID', () => {

  test('Get by Record ID navigates to entity detail', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/search/by-id');
    await page.waitForLoadState('networkidle');

    // Wait for the search form and data source dropdown to populate
    const form = page.locator('sz-search-by-id-grpc');
    await expect(form).toBeVisible({ timeout: 10000 });
    const dsDropdown = form.locator('#datasource-name');
    await expect(dsDropdown.locator('option[value="CUSTOMERS"]')).toBeAttached({ timeout: 10000 });

    // Select data source and enter record ID (Robert Smith)
    await dsDropdown.selectOption('CUSTOMERS');
    await form.locator('#record-id').fill('1001');

    // Click the search button and wait for navigation to entity detail
    await form.locator('button.button__search-go').first().click();
    await page.waitForURL('**/search/by-id/entities/**', { timeout: 10000 });

    // Verify entity detail component renders
    await expect(page.locator('sz-entity-detail-grpc')).toBeVisible({ timeout: 15000 });

    // No critical JS errors
    const critical = errors.filter(e =>
      e.includes('NullInjectorError') ||
      e.includes('Cannot read properties') ||
      e.includes('is not a function')
    );
    expect(critical).toHaveLength(0);
  });

  test('Get by Entity ID navigates to entity detail', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/search/by-id');
    await page.waitForLoadState('networkidle');

    const form = page.locator('sz-search-by-id-grpc');
    await expect(form).toBeVisible({ timeout: 10000 });

    // Enter entity ID
    await form.locator('#entity-id').fill('1');

    // Click search and wait for navigation to entity detail
    await form.locator('button.button__search-go').first().click();
    await page.waitForURL('**/search/by-id/entities/**', { timeout: 10000 });

    // Verify entity detail component renders
    await expect(page.locator('sz-entity-detail-grpc')).toBeVisible({ timeout: 15000 });

    // No critical JS errors
    const critical = errors.filter(e =>
      e.includes('NullInjectorError') ||
      e.includes('Cannot read properties') ||
      e.includes('is not a function')
    );
    expect(critical).toHaveLength(0);
  });

  test('Bad Record ID shows no-results message with search parameters', async ({ page }) => {
    await page.goto('/search/by-id');
    await page.waitForLoadState('networkidle');

    const form = page.locator('sz-search-by-id-grpc');
    await expect(form).toBeVisible({ timeout: 10000 });
    const dsDropdown = form.locator('#datasource-name');
    await expect(dsDropdown.locator('option[value="CUSTOMERS"]')).toBeAttached({ timeout: 10000 });

    // Search for a record that doesn't exist
    await dsDropdown.selectOption('CUSTOMERS');
    await form.locator('#record-id').fill('996645');
    await form.locator('button.button__search-go').first().click();

    // Verify no-results message appears with the search parameters
    const noResults = page.locator('.no-results');
    await expect(noResults).toBeVisible({ timeout: 10000 });
    await expect(noResults).toContainText('996645');
    await expect(noResults).toContainText('CUSTOMERS');
  });

  test('Bad Entity ID shows no-results message with search parameters', async ({ page }) => {
    await page.goto('/search/by-id');
    await page.waitForLoadState('networkidle');

    const form = page.locator('sz-search-by-id-grpc');
    await expect(form).toBeVisible({ timeout: 10000 });

    // Search for an entity that doesn't exist
    await form.locator('#entity-id').fill('996644');
    await form.locator('button.button__search-go').first().click();

    // Verify no-results message appears with the search parameters
    const noResults = page.locator('.no-results');
    await expect(noResults).toBeVisible({ timeout: 10000 });
    await expect(noResults).toContainText('996644');
  });

  test('Clear button hides no-results message', async ({ page }) => {
    await page.goto('/search/by-id');
    await page.waitForLoadState('networkidle');

    const form = page.locator('sz-search-by-id-grpc');
    await expect(form).toBeVisible({ timeout: 15000 });

    // Trigger a no-results state first
    await form.locator('#entity-id').fill('996644');
    await form.locator('button.button__search-go').first().click();

    const noResults = page.locator('.no-results');
    await expect(noResults).toBeVisible({ timeout: 10000 });

    // Click the Clear button
    await form.locator('button.button__search-clear').first().click();

    // Verify no-results message is hidden
    await expect(noResults).not.toBeVisible({ timeout: 5000 });
  });
});
