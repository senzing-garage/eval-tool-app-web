import { test, expect } from '@playwright/test';
import { getEntityIdByRecordId } from '../helpers/grpc';

test.describe('Entity Detail - How Report', () => {
  let entityId: number;

  test.beforeAll(async () => {
    entityId = await getEntityIdByRecordId('CUSTOMERS', '1001');
  });

  test('how button navigates to how report page', async ({ page }) => {
    // Navigate to entity detail page
    await page.goto(`/entity/${entityId}`);
    await page.waitForLoadState('networkidle');

    // Find and click the How Report button
    const howButton = page.locator('button.detail-header-how-button', { hasText: 'How Report' });
    await expect(howButton).toBeVisible({ timeout: 10000 });
    await howButton.click();

    // Verify navigation to the how route
    await page.waitForURL(`**/how/${entityId}`, { timeout: 10000 });
  });

  test('how report page renders step cards', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Navigate directly to the how report page
    await page.goto(`/how/${entityId}`);
    await page.waitForLoadState('networkidle');

    // Verify the how entity component rendered
    const howEntity = page.locator('sz-how-entity-grpc');
    await expect(howEntity).toBeVisible({ timeout: 15000 });

    // Verify step nodes rendered (at least one)
    const stepNodes = page.locator('sz-how-step-node');
    await expect(stepNodes.first()).toBeVisible({ timeout: 15000 });

    // Verify at least one card type rendered (step, singleton, or final)
    const cards = page.locator('sz-how-step-card, sz-how-singleton-card, sz-how-final-entity-card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Verify no critical errors
    const criticalErrors = errors.filter(e =>
      e.includes('NullInjectorError') ||
      e.includes('Cannot read properties') ||
      e.includes('is not a function')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
