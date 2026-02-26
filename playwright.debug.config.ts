import { defineConfig, devices } from '@playwright/test';

/**
 * Debug config — runs only tests in e2e/debug/.
 *
 *   npx playwright test --config=playwright.debug.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /debug\/.*/,
  timeout: 5 * 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'debug',
      use: {
        headless: false,
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'debug-edge',
      use: {
        headless: false,
        ...devices['Desktop Edge'],
      },
    },
  ],
});
