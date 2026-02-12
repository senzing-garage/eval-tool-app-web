import { test, expect } from '@playwright/test';

test.describe('Cross Source Select - Hidden Data Sources', () => {
  test('should not show TEST or SEARCH in pulldown menus', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('/review');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for sz-cross-source-select component
    const selectComponent = page.locator('sz-cross-source-select');
    const selectCount = await selectComponent.count();
    console.log(`Found ${selectCount} sz-cross-source-select components`);

    // Find all menu trigger buttons inside the component
    const menuButtons = selectComponent.locator('button[mat-button], button[mat-icon-button], button[matMenuTriggerFor], [mat-menu-trigger-for]');
    const buttonCount = await menuButtons.count();
    console.log(`Found ${buttonCount} menu buttons`);

    // Try clicking each button to open menu and inspect options
    const allButtons = selectComponent.locator('button');
    const allButtonCount = await allButtons.count();
    console.log(`Found ${allButtonCount} total buttons in cross-source-select`);

    for (let i = 0; i < allButtonCount; i++) {
      const btn = allButtons.nth(i);
      const btnText = await btn.textContent();
      console.log(`Button ${i}: "${btnText?.trim()}"`);
    }

    // Look for mat-menu items that might be open or openable
    // Click the first pulldown-style button to open the menu
    const pulldownButtons = selectComponent.locator('.pulldown-menu-btn, [matmenutriggerfor], [mat-menu-trigger-for]');
    const pulldownCount = await pulldownButtons.count();
    console.log(`Found ${pulldownCount} pulldown buttons`);

    // Try to find and click menu trigger buttons
    const triggerButtons = selectComponent.locator('button');
    for (let i = 0; i < await triggerButtons.count(); i++) {
      const trigger = triggerButtons.nth(i);
      const isVisible = await trigger.isVisible();
      if (!isVisible) continue;

      const text = await trigger.textContent();
      // Skip arrow/step buttons, look for datasource name buttons
      if (text?.includes('chevron') || text?.includes('arrow')) continue;

      console.log(`Clicking button ${i}: "${text?.trim()}"`);
      await trigger.click();
      await page.waitForTimeout(500);

      // Check for open mat-menu overlay
      const menuItems = page.locator('.mat-mdc-menu-item, .mat-menu-item');
      const menuItemCount = await menuItems.count();
      console.log(`  Menu items visible: ${menuItemCount}`);

      for (let j = 0; j < menuItemCount; j++) {
        const itemText = await menuItems.nth(j).textContent();
        console.log(`  Menu item ${j}: "${itemText?.trim()}"`);

        // Assert TEST and SEARCH are not in the menu
        expect(itemText?.toUpperCase()).not.toContain('TEST');
        expect(itemText?.toUpperCase()).not.toContain('SEARCH');
      }

      // Close menu by pressing escape
      if (menuItemCount > 0) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // Print console messages for debugging
    console.log('\n--- Browser Console Messages ---');
    consoleMessages.forEach(m => {
      console.log(`[${m.type}] ${m.text}`);
    });
  });
});
