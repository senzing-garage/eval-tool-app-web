import { defineConfig, devices } from '@playwright/test';

/**
 * CI config — imports truthset data before running tests.
 *
 *   npx playwright test --config=playwright.ci.config.ts
 *
 * The "setup" project loads truthset data first,
 * then "chromium" runs all other tests.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 2 * 60_000,
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /setup\/.*/,
      use: {
        headless: false,
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testIgnore: [/setup\/.*/, /debug\/.*/],
      use: {
        headless: false,
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
