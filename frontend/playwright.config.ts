import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';

/**
 * Browser tests run against the real app. `bun run e2e` runs the smoke checks and
 * `bun run screenshots` saves screenshots at phone, tablet and desktop sizes. Both start the
 * dev servers when they are not already running.
 */
export default defineConfig({
  testDir: './e2e',
  // Generous, because a cold dev server compiles the page on the first request and the backend
  // may scrape the day on its first request too.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    viewport: { width: 1400, height: 1000 },
  },
  projects: [
    { name: 'smoke', testMatch: /menu\.spec\.ts/ },
    { name: 'screenshots', testMatch: /screenshots\.spec\.ts/ },
  ],
  webServer: [
    {
      command: 'uv run manage.py runserver',
      cwd: '../backend',
      // A request without a date is a quick 400 from the API, which counts as "up".
      url: `${API_URL}/api/menus/`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'bun run dev',
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
