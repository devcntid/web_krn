import "server-only";

import { inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { siteDefaults } from "@/config/site";
import { CACHE_TAGS } from "@/lib/content";
import { SITE_SETTINGS_KEYS, type SiteSettings, type SiteSettingsKey, siteSettingsSchema } from "@/lib/site-settings-schema";
import { logActivity } from "./activity";
import { getDb, schema } from "./db";
import type { AuthUser } from "./permissions";

const { settings } = schema;

const LABELS: Record<SiteSettingsKey, string> = {
  identity: "identitas",
  contact: "kontak",
  socials: "tautan sosial",
  menu: "menu navigasi",
  integrations: "integrasi & tombol",
};

/**
 * Baca pengaturan langsung dari database. Tiap kunci divalidasi terpisah; kunci yang belum ada
 * atau tidak sah memakai fallback src/config/site.ts sehingga situs publik tidak pernah rusak.
 */
export async function readSiteSettings(): Promise<SiteSettings> {
  const rows = await getDb().select({ key: settings.key, value: settings.value }).from(settings).where(inArray(settings.key, SITE_SETTINGS_KEYS));
  const out: Record<string, unknown> = { ...siteDefaults };
  for (const row of rows) {
    const key = row.key as SiteSettingsKey;
    const parsed = siteSettingsSchema.shape[key].safeParse(row.value);
    if (parsed.success) out[key] = parsed.data;
    else console.error(`settings.${key} tidak sah, memakai fallback:`, parsed.error.issues.slice(0, 3));
  }
  return out as SiteSettings;
}

const cached = unstable_cache(readSiteSettings, ["site-settings"], { tags: [CACHE_TAGS.settings] });

/** Pengaturan untuk situs publik (cache bertag `settings`, disegarkan saat admin menyimpan). */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return await cached();
  } catch (error) {
    // Database tak terjangkau (mis. build tanpa DATABASE_URL) → fallback, jangan gagalkan halaman.
    console.error("Gagal membaca pengaturan situs:", error);
    return siteDefaults;
  }
});

export type SaveSettingsResult = { ok: true; changed: SiteSettingsKey[] } | { ok: false; error: string };

/** Simpan seluruh pengaturan; hanya kunci yang berubah yang ditulis dan dicatat di log. */
export async function saveSiteSettings(user: AuthUser, input: unknown): Promise<SaveSettingsResult> {
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? `${LABELS[issue.path[0] as SiteSettingsKey] ?? issue.path[0]}: ` : "";
    return { ok: false, error: `${where}${issue?.message ?? "Data tidak sah"}` };
  }
  const next = parsed.data;
  const before = await readSiteSettings();
  const changed = SITE_SETTINGS_KEYS.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(next[k]));
  if (!changed.length) return { ok: true, changed };

  const db = getDb();
  await db.transaction(async (tx) => {
    for (const key of changed) {
      await tx
        .insert(settings)
        .values({ key, value: next[key], updatedBy: user.id })
        .onConflictDoUpdate({ target: settings.key, set: { value: next[key], updatedBy: user.id } });
    }
    await logActivity(
      {
        userId: user.id,
        action: "edit",
        entity: "settings",
        entityId: changed.join(","),
        summary: `Mengubah pengaturan situs: ${changed.map((k) => LABELS[k]).join(", ")}`,
        diff: Object.fromEntries(changed.map((k) => [k, [before[k], next[k]]])),
      },
      tx,
    );
  });
  return { ok: true, changed };
}
