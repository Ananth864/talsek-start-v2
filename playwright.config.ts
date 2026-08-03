import { defineConfig, devices } from '@playwright/test'

// Playwright doesn't auto-load .env.local; do it here so E2E_EMAIL/PASSWORD etc.
// are available to the specs. (Node 20.12+/26 has process.loadEnvFile.)
try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local optional (e.g. CI injects vars directly)
}

/**
 * Target-agnostic harness. The SAME specs run against either:
 *   - the SOURCE app   (E2E_TARGET=source)  — to capture current behaviour
 *   - the NEW app       (E2E_TARGET=new, default) — to verify parity
 *
 * Examples:
 *   E2E_TARGET=source E2E_EMAIL=a@b.c E2E_PASSWORD=secret bun e2e:install && bun e2e
 *   E2E_TARGET=new    E2E_EMAIL=a@b.c E2E_PASSWORD=secret bun e2e
 */
const target = (process.env.E2E_TARGET ?? 'new').toLowerCase()
const baseURL =
  process.env.E2E_BASE_URL ??
  (target === 'source' ? 'http://localhost:5173' : 'http://localhost:3000')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: target === 'source' ? 'npm run dev' : 'bun run dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        cwd: target === 'source' ? '../talsek' : undefined,
        // Stub the Resume AI pipeline so #9 E2E exercises the sync chain
        // without multi-minute hedged provider calls (ADR-0014 §5).
        env:
          target === 'new'
            ? {
                ...process.env,
                AI_PIPELINE_STUB: '1',
                BILLING_STUB: '1',
                EMAIL_STUB: '1',
                // Empty .env.local CRON_SECRET would 401 all cron routes; pin for E2E.
                CRON_SECRET:
                  process.env.CRON_SECRET && process.env.CRON_SECRET.length > 0
                    ? process.env.CRON_SECRET
                    : 'e2e-cron-secret',
              }
            : undefined,
      },
})
