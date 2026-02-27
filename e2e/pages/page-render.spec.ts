import { test, expect } from '@playwright/test';
import { getEntityIdByRecordId } from '../helpers/grpc';

type ChildCheck = string | { selector: string; count: number };

const routes: {
  route: string;
  main: string;
  children: ChildCheck[];
}[] = [
  {
    route: '/overview',
    main: 'app-overview',
    children: ['sz-record-counts-donut', 'sz-license', 'sz-search-grpc', 'sz-cross-source-select', 'sz-cross-source-summary'],
  },
  {
    route: '/review',
    main: 'app-sample-review',
    children: ['sz-cross-source-statistics'],
  },
  {
    route: '/datasources',
    main: 'data-files',
    children: ['sz-data-source-collection'],
  },
  {
    route: '/settings',
    main: 'app-settings',
    children: [{ selector: '.prefs-section', count: 5 }],
  },
  {
    route: '/license',
    main: 'app-license',
    children: ['sz-license'],
  },
  {
    route: '/search/by-attribute',
    main: 'app-search',
    children: ['sz-search-grpc'],
  },
  {
    route: '/search/by-id',
    main: 'app-search-by-id',
    children: ['sz-search-by-id-grpc'],
  },
];

// Graph route uses a dynamic entity ID looked up by record
const graphRoute = {
  main: 'app-graph',
  children: ['sz-standalone-graph'] as ChildCheck[],
};

test.describe('Page render smoke tests', () => {
  for (const { route, main, children } of routes) {
    test(`${route} renders without errors`, async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on('pageerror', (err) => pageErrors.push(err));

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Main component visible
      await expect(page.locator(main)).toBeVisible();

      // All child components visible
      for (const child of children) {
        if (typeof child === 'string') {
          await expect(page.locator(child)).toBeVisible();
        } else {
          await expect(page.locator(child.selector)).toHaveCount(child.count);
        }
      }

      // No uncaught page errors
      expect(pageErrors.map(e => e.message)).toEqual([]);
    });
  }

  test('/graph/:entityId renders without errors', async ({ page }) => {
    const entityId = await getEntityIdByRecordId('CUSTOMERS', '1001');
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto(`/graph/${entityId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator(graphRoute.main)).toBeVisible();
    for (const child of graphRoute.children) {
      await expect(page.locator(child as string)).toBeVisible();
    }

    expect(pageErrors.map(e => e.message)).toEqual([]);
  });
});
