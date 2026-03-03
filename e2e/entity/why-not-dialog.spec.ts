import { test, expect } from '@playwright/test';
import { getEntityIdByRecordId } from '../helpers/grpc';

test.describe('Entity Detail - Why Not Dialog', () => {
  let entityId: number;

  test.beforeAll(async () => {
    // Robert Smith (CUSTOMERS 1001) has related entities to compare
    entityId = await getEntityIdByRecordId('CUSTOMERS', '1001');
  });

  test('why not dialog opens and renders for a related entity', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Navigate to entity detail
    await page.goto(`/entity/${entityId}`);
    await page.waitForLoadState('networkidle');

    // Wait for the entity detail to render with related entity cards
    const relatedCard = page.locator('sz-entity-record-card-content-grpc.select-mode-single');
    await expect(relatedCard.first()).toBeVisible({ timeout: 15000 });

    // The Why Not button is display:none until parent hover.
    // Use dispatchEvent to click it since Playwright can't click hidden elements.
    const whyNotButton = page.locator('.select-mode-action-why-not').first();
    await whyNotButton.dispatchEvent('click');

    // Verify dialog opened
    const dialog = page.locator('.cdk-overlay-container mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Verify the why entities component rendered inside the dialog
    const whyComponent = dialog.locator('sz-why-entities-grpc');
    await expect(whyComponent).toBeVisible({ timeout: 5000 });

    // Verify the title does NOT contain [object Object]
    const title = dialog.locator('[mat-dialog-title]');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).not.toContain('[object Object]');
    expect(titleText).toContain('did not resolve');

    // Wait for the why data to load (spinner disappears)
    await expect(dialog.locator('.spinner-panel')).toBeHidden({ timeout: 30000 });

    // Verify the comparison table has rendered with rows
    const tableRows = dialog.locator('sz-why-entities-grpc .table-format .tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 15000 });

    // Verify no errors
    const criticalErrors = errors.filter(e =>
      e.includes('NullInjectorError') ||
      e.includes('Cannot read properties') ||
      e.includes('is not a function')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
