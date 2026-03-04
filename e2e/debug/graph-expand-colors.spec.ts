import { test, expect } from '@playwright/test';

test('graph expanded nodes should have datasource color classes', async ({ page }) => {
  await page.goto('/graph/29');
  await page.waitForTimeout(4000);

  await page.screenshot({ path: '/tmp/graph-expand-1-initial.png' });

  // log initial node classes (only actual entity nodes, not links/labels)
  const getNodeInfo = () => page.evaluate(() => {
    const nodeGroups = document.querySelectorAll('g[class*="sz-graph-node"], g[class*="sz-graph-core-node"], g[class*="sz-graph-primary-node"], g[class*="sz-graph-queried-node"]');
    return Array.from(nodeGroups).map(n => {
      const textEls = n.querySelectorAll('text');
      const label = Array.from(textEls).map(t => t.textContent?.trim()).filter(Boolean).join(' ') || '(no label)';
      return { classes: n.getAttribute('class'), label };
    });
  });

  console.log('--- INITIAL NODES ---');
  (await getNodeInfo()).forEach(n => console.log(`  ${n.label}: ${n.classes}`));

  // click the expand bubble via JS dispatchEvent to bypass SVG intercept
  const expanded = await page.evaluate(() => {
    // find the circle with the "1" text - that's Patricia Smith's expand bubble
    const toggleCircles = document.querySelectorAll('circle.sz-graph-icon-edge-toggle');
    for (const circle of toggleCircles) {
      const parent = circle.closest('g');
      const countText = parent?.querySelector('.sz-graph-icon-edge-glyph-count');
      if (countText && countText.textContent?.trim() === '1') {
        circle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return true;
      }
    }
    // fallback: click the first has-collapsed-edges node's toggle
    const collapsedNode = document.querySelector('.has-collapsed-edges circle.sz-graph-icon-edge-toggle');
    if (collapsedNode) {
      collapsedNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    }
    return false;
  });

  console.log(`Expand clicked: ${expanded}`);
  await page.waitForTimeout(8000);

  await page.screenshot({ path: '/tmp/graph-expand-2-expanded.png' });

  console.log('--- AFTER EXPAND ---');
  (await getNodeInfo()).forEach(n => console.log(`  ${n.label}: ${n.classes}`));
});
