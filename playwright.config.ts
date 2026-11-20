import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 3101);

/**
 * MÓDULO 17A — Fase 4: prueba de pantallas del piloto.
 * Usa Microsoft Edge instalado en el equipo (no descarga navegadores).
 * Ejecutar: npm run e2e
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
  },
  projects: [
    { name: 'terreno-telefono', use: { ...devices['Pixel 7'], channel: 'msedge' } },
  ],
  webServer: {
    command: 'npx tsx tests/e2e/server.ts',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { E2E_PORT: String(PORT) },
  },
});
