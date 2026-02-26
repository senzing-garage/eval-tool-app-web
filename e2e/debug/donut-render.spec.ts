import { test, expect } from '@playwright/test';

test.describe('Debug - Donut render after polling', () => {
  test('inspect donut state on /overview', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');

    const donut = page.locator('sz-record-counts-donut');
    await expect(donut).toBeVisible();

    // Wait for data to arrive
    await expect(donut).toHaveAttribute('aria-totalrecords', /\d+/, { timeout: 30_000 });
    const totalRecords = await donut.getAttribute('aria-totalrecords');
    console.log(`[donut] aria-totalrecords = ${totalRecords}`);

    // Check the text content in the center of the donut
    const totalRecordTitle = donut.locator('.total-record-title');
    const titleText = await totalRecordTitle.textContent();
    console.log(`[donut] .total-record-title text = "${titleText?.trim()}"`);

    // Check the data sources label
    const dsLabel = donut.locator('.total-data-sources__label');
    const dsLabelText = await dsLabel.textContent();
    console.log(`[donut] .total-data-sources__label text = "${dsLabelText?.trim()}"`);

    // Check legend items (each datasource row)
    const legendItems = donut.locator('ul.legend.from-data-source li.legend-items');
    const legendCount = await legendItems.count();
    console.log(`[donut] legend items count = ${legendCount}`);
    for (let i = 0; i < legendCount; i++) {
      const item = legendItems.nth(i);
      const countText = await item.locator('.legend__count').textContent();
      const nameText = await item.locator('.legend__subtitle').textContent();
      console.log(`[donut]   legend[${i}]: "${nameText?.trim()}" = ${countText?.trim()}`);
    }

    // Check SVG arcs (the actual donut drawing)
    const svg = donut.locator('svg.donut-chart');
    await expect(svg).toBeVisible();
    const arcPaths = svg.locator('g.arc path');
    const arcCount = await arcPaths.count();
    console.log(`[donut] SVG arc <path> count = ${arcCount}`);
    for (let i = 0; i < arcCount; i++) {
      const d = await arcPaths.nth(i).getAttribute('d');
      const cls = await arcPaths.nth(i).getAttribute('class');
      const fill = await arcPaths.nth(i).evaluate(el => (el as SVGElement).style.fill);
      console.log(`[donut]   arc[${i}]: class="${cls}" fill="${fill}" d="${d?.substring(0, 60)}..."`);
    }

    // Check the top-level <g> inside the SVG
    const svgGroups = svg.locator('> g');
    const groupCount = await svgGroups.count();
    console.log(`[donut] SVG top-level <g> count = ${groupCount}`);

    // Dump full SVG innerHTML for inspection
    const svgHtml = await svg.innerHTML();
    console.log(`[donut] SVG innerHTML (${svgHtml.length} chars):`);
    console.log(svgHtml);

    // Now wait for a polling cycle (20s) and check if it redraws
    console.log(`\n[donut] Waiting 25s for polling cycle...`);
    await page.waitForTimeout(25_000);

    const totalRecordsAfter = await donut.getAttribute('aria-totalrecords');
    console.log(`[donut] aria-totalrecords after poll = ${totalRecordsAfter}`);

    const arcCountAfter = await svg.locator('g.arc path').count();
    console.log(`[donut] SVG arc <path> count after poll = ${arcCountAfter}`);

    const svgHtmlAfter = await svg.innerHTML();
    console.log(`[donut] SVG innerHTML after poll (${svgHtmlAfter.length} chars):`);
    console.log(svgHtmlAfter);

    // Just pass — this is a debug/inspection test
    expect(true).toBe(true);
  });
});
