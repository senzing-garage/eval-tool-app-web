import { test, expect } from '@playwright/test';

test.describe('Graph - Entity /graph/1', () => {
  test('loads graph page for entity 1', async ({ page }) => {
    const entityId = 1;
    const consoleMessages: { type: string; text: string; timestamp: number }[] = [];
    const startTime = Date.now();

    // Listen for console events
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now() - startTime,
      });
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now() - startTime,
      });
    });

    // Navigate to graph page
    console.log(`Navigating to /graph/${entityId}...`);
    await page.goto(`/graph/${entityId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify we're on the graph route
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    expect(currentUrl).toContain(`/graph/${entityId}`);

    // Check that the graph component rendered
    const graphComponent = page.locator('app-graph');
    await expect(graphComponent).toBeVisible({ timeout: 10000 });
    console.log('Graph component is visible');

    // Check for the standalone graph canvas
    const standaloneGraph = page.locator('sz-standalone-graph');
    await expect(standaloneGraph).toBeVisible({ timeout: 10000 });
    console.log('Standalone graph is visible');

    // Check for the right-rail drawer
    const drawer = page.locator('#graph-drawer');
    const drawerExists = await drawer.count();
    console.log(`Graph drawer found: ${drawerExists > 0}`);

    // Check for filter/detail tabs
    const detailTab = page.locator('button.tab', { hasText: 'details' });
    const filtersTab = page.locator('button.tab', { hasText: 'filters' });
    if (await detailTab.count() > 0) {
      console.log('Detail tab found');
    }
    if (await filtersTab.count() > 0) {
      console.log('Filters tab found');
    }

    // Check that link labels contain match key text
    const linkLabels = page.locator('.sz-graph-link-label textPath');
    const labelCount = await linkLabels.count();
    console.log(`Found ${labelCount} link label textPaths`);
    expect(labelCount).toBeGreaterThan(0);

    // Verify at least one label has non-empty text
    const labelTexts: string[] = [];
    for (let i = 0; i < labelCount; i++) {
      const text = await linkLabels.nth(i).textContent();
      if (text && text.trim()) {
        labelTexts.push(text.trim());
      }
    }
    console.log(`Link labels with text: ${labelTexts.length} — values: ${labelTexts.join(', ')}`);
    expect(labelTexts.length).toBeGreaterThan(0);

    // Dump node icon types
    const nodes = page.locator('.sz-graph-node');
    const nodeCount = await nodes.count();
    console.log(`\nFound ${nodeCount} graph nodes`);
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes.nth(i);
      const classes = await node.getAttribute('class');
      const iconGroup = node.locator('g');
      const iconGroupCount = await iconGroup.count();
      let iconClasses = '';
      if (iconGroupCount > 0) {
        iconClasses = await iconGroup.first().getAttribute('class') || '';
      }
      const textEl = node.locator('text');
      const name = textEl.count() ? await textEl.first().textContent() : '?';
      console.log(`  Node ${i}: name="${name}" classes="${classes}" iconClasses="${iconClasses}"`);
    }

    // Dump SVG inner HTML for icon inspection
    const svgContent = await page.evaluate(() => {
      const svg = document.querySelector('sz-relationship-network svg');
      if (!svg) return 'No SVG found';
      const nodes = svg.querySelectorAll('.sz-graph-node');
      return Array.from(nodes).map((n, i) => {
        const g = n.querySelector('g');
        const text = n.querySelector('text');
        return `Node ${i} [${text?.textContent?.trim()}]: iconGroup classes="${g?.getAttribute('class')}" children=${g?.children.length} innerHTML=${g?.innerHTML.substring(0, 200)}`;
      }).join('\n');
    });
    console.log(`\n--- Node SVG Details ---\n${svgContent}`);

    // Check what FEATURES data each entity in the network has
    const featuresCheck = await page.evaluate(() => {
      // Access the component's data through the DOM
      const comp = document.querySelector('sz-relationship-network') as any;
      if (comp && comp.__ngContext__) {
        return 'Has ngContext but cannot easily read data';
      }
      return 'Could not access component';
    });
    console.log(`\nFeatures check: ${featuresCheck}`);

    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Print console messages for debugging
    console.log('\n--- Console Messages ---');
    consoleMessages
      .filter((m) => m.type === 'log' || m.type === 'error' || m.type === 'pageerror')
      .slice(-30)
      .forEach((m) => {
        console.log(`[${m.timestamp}ms] ${m.type}: ${m.text}`);
      });
  });
});
