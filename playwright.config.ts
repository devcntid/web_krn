import { defineConfig } from "@playwright/test";

/**
 * E2E (B16): `npm run test:e2e`. Menjalankan `next dev` di port 3200 terhadap DATABASE_URL
 * dari E2E_ENV_FILE (bawaan .env.local). Data uji berawalan zz-e2e dibuat di global-setup dan
 * dihapus di teardown. Gunakan database/branch terpisah bila tersedia.
 */
process.env.E2E_ENV_FILE ??= ".env.local";
const PORT = 3200;
/** E2E_BASE_URL=http://localhost:3000 → pakai server yang sudah berjalan (tanpa webServer). */
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 30_000 },
  workers: 1,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: external ?? `http://localhost:${PORT}`, channel: "chrome", headless: true, trace: "retain-on-failure" },
  webServer: external
    ? undefined
    : {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/admin/login/`,
    timeout: 180_000,
    reuseExistingServer: false,
    // Redirect dinamis dibaca langsung dari DB tanpa cache agar redirect baru langsung berlaku.
    env: { REDIRECTS_CACHE_MS: "0" },
  },
});
