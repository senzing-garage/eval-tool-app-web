import { defineConfig, devices } from '@playwright/test';

/**
 * Local development config.
 *
 * Assumes the dev server and gRPC backend are already running
 * and truthset data has been loaded.
 *
 *   npx playwright test            # headless
 *   npx playwright test --headed   # watch the browser
 *
 * For CI (imports truthset first), use playwright.ci.config.ts.
 */
export default defineConfig({
  testDir: './e2e',
  testIgnore: [/setup\/.*/, /debug\/.*/],
  timeout: 2 * 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env['GITHUB_ACTIONS'],
  retries: 0,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        headless: false,
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
