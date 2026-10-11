// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { PORT, BASE } = require('./tests/root');

// De tests draaien op een eigen poort, los van `npm run serve`.
// Taal van de testbrowser is Nederlands; tests die iets anders nodig hebben kiezen dat zelf.
const mobile = { ...devices['Pixel 5'], serviceWorkers: 'block', locale: 'nl-NL' };

module.exports = defineConfig({
  testDir: './tests',
  timeout: process.env.CI ? 90_000 : 45_000,
  expect: { timeout: process.env.CI ? 15_000 : 8_000 },
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: BASE, screenshot: 'only-on-failure', video: 'off' },
  // Elk formaat draait de schermtests (start.spec.js); de overige tests draaien één keer.
  projects: [
    { name: 'phone-portrait',   use: { ...mobile, viewport: { width: 393, height: 851 } } },
    { name: 'phone-landscape',  use: { ...mobile, viewport: { width: 851, height: 393 } } },
    { name: 'tablet-portrait',  use: { ...mobile, viewport: { width: 768, height: 1024 } } },
  ],
  webServer: {
    command: `node tests/start-server.mjs ${PORT}`,
    url: BASE,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
