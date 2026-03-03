import { test, expect } from '@playwright/test';
import { getEntityIdByRecordId } from '../helpers/grpc';

test.describe('Entity Detail - Why Dialog', () => {
  let entityId: number;

  test.beforeAll(async () => {
    entityId = await getEntityIdByRecordId('CUSTOMERS', '1001');
  });

  test('why dialog opens and renders for a record card', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Navigate to entity detail
    await page.goto(`/entity/${entityId}`);
    await page.waitForLoadState('networkidle');

    // Wait for record cards to render
    const recordCard = page.locator('sz-entity-record-card-content-grpc.select-mode-single');
    await expect(recordCard.first()).toBeVisible({ timeout: 15000 });

    // The Why button is display:none until hover — use dispatchEvent to click it
    const whyButton = page.locator('.select-mode-action-why').first();
    await whyButton.dispatchEvent('click');

    // Verify the dialog opened
    const dialog = page.locator('.cdk-overlay-container mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Verify the why record component rendered inside the dialog
    const whyComponent = dialog.locator('sz-why-record-grpc');
    await expect(whyComponent).toBeVisible({ timeout: 5000 });

    // Verify the title contains "Why Record" with a data source and record ID
    const title = dialog.locator('[mat-dialog-title]');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toContain('Why Record');
    expect(titleText).not.toContain('[object Object]');

    // Wait for the data to load (spinner disappears)
    await expect(dialog.locator('.spinner-panel')).toBeHidden({ timeout: 30000 });

    // Verify the comparison table rendered with rows
    const tableRows = dialog.locator('sz-why-record-grpc .table-format .tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 15000 });

    // Verify no critical errors
    const criticalErrors = errors.filter(e =>
      e.includes('NullInjectorError') ||
      e.includes('Cannot read properties') ||
      e.includes('is not a function')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
