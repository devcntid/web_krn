import fs from "node:fs";

import { type Page, expect, test } from "@playwright/test";
import { generate } from "otplib";

import { E2E } from "./constants";

const stamp = Date.now().toString(36);
const TITLE = `ZZ E2E Uji Alur Terbit ${stamp}`;
const SLUG = `zz-e2e-uji-alur-terbit-${stamp}`;
const BERITA_ID = "5";

async function login(page: Page, email: string) {
  await page.goto("/admin/login/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill(E2E.password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}

async function logout(page: Page) {
  await page.context().clearCookies();
}

test("login → tulis draf → review → terbit → tampil di /berita/ → redirect 301", async ({ page, request }) => {
  // Pengunjung di balik mode perawatan tetap bisa diuji: cookie sesi admin melewati halaman 503.
  // 1) Kontributor menulis draf lalu mengirim ke review.
  await login(page, E2E.contributor);
  await page.waitForURL(/\/admin\/$/);
  await page.goto("/admin/publikasi/baru/");
  await page.getByPlaceholder("Tulis judul publikasi").fill(TITLE);
  const body = page.getByRole("textbox", { name: "Isi publikasi" });
  await body.click();
  await body.pressSequentially("Isi uji otomatis alur terbit.");
  await page.getByLabel("Tambah kategori").selectOption(BERITA_ID);
  await page.getByRole("button", { name: "Simpan draf" }).click();
  await page.waitForURL(/\/admin\/publikasi\/\d+\/$/);
  const editUrl = page.url();
  await page.getByRole("button", { name: "Kirim ke Review" }).click();
  await expect(page.getByText(/review/i).first()).toBeVisible();
  await logout(page);

  // 2) Editor (2FA) meninjau dan menerbitkan.
  await login(page, E2E.editor);
  const { totpSecret } = JSON.parse(fs.readFileSync(E2E.stateFile, "utf8")) as { totpSecret: string };
  await page.getByLabel("Kode 6 digit dari aplikasi autentikator").fill(await generate({ secret: totpSecret }));
  await page.getByRole("button", { name: "Verifikasi" }).click();
  await page.waitForURL(/\/admin\/$/);
  await page.goto(editUrl);
  await page.getByRole("button", { name: "Terbitkan", exact: true }).click();
  await expect(page.getByText("Terbit", { exact: true }).first()).toBeVisible();

  // 3) Tampil di /berita/ tanpa redeploy (cache disegarkan oleh updateTag).
  await page.goto("/berita/");
  await expect(page.getByRole("link", { name: TITLE }).first()).toBeVisible();
  const post = await page.goto(`/${SLUG}/`);
  expect(post?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLE);

  // 4) Buat redirect di /admin/seo lalu cek 301.
  await page.goto("/admin/seo/");
  await page.getByRole("button", { name: "+ Tambah Redirect" }).click();
  await page.getByLabel("Dari URL (path lama)").fill(`/zz-e2e-lama-${stamp}/`);
  await page.getByLabel("Ke URL (path baru atau https://…)").fill(`/${SLUG}/`);
  await page.locator("dialog[open]").getByRole("button", { name: /^Simpan/ }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);

  // Peta redirect di proxy di-cache per instance (bawaan 30 dtk; 0 di webServer e2e) → tunggu hingga berlaku.
  const check = () => request.get(`/zz-e2e-lama-${stamp}/`, { maxRedirects: 0, headers: { cookie: "authjs.session-token=e2e" } });
  await expect.poll(async () => (await check()).status(), { timeout: 45_000, intervals: [1000, 2000, 5000] }).toBe(301);
  const res = await check();
  expect(new URL(res.headers().location!, "http://x").pathname).toBe(`/${SLUG}/`);
});
