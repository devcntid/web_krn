import "server-only";

import { eq, ne } from "drizzle-orm";

import { legacyRedirects } from "@/config/redirects";
import { isDonationAppPath } from "@/config/routes";
import { BUILTIN_FRONT_PAGE } from "@/lib/site-settings-schema";
import type { JsonObject } from "@/lib/section-fields";
import type { AdminPageItem, EditorPage, EditorSection } from "@/types/admin-pages";
import { getDb, schema } from "../db";
import { PAGE_TEMPLATES, type PageTemplate, parseSections } from "../sections";

const { pages } = schema;

/** Halaman yang dirender otomatis oleh route-nya sendiri — isinya bukan dari `pages.sections`. */
export const SYSTEM_PAGE_PATHS: ReadonlySet<string> = new Set(["new-beranda", "artikel", "berita"]);

const REDIRECTED = new Set(legacyRedirects.map((r) => r.source.replace(/^\/+|\/+$/g, "")));

/** Semua halaman (selain sampah), induk diikuti anak-anaknya. */
export async function listAdminPages(): Promise<AdminPageItem[]> {
  const rows = await getDb().select({ id: pages.id, path: pages.path, title: pages.title, status: pages.status }).from(pages).where(ne(pages.status, "trashed"));
  return rows
    .map((r): AdminPageItem => ({ ...r, kind: SYSTEM_PAGE_PATHS.has(r.path) ? "system" : "editable", redirected: REDIRECTED.has(r.path) }))
    .sort((a, b) => {
      // Halaman aktif dulu, halaman yang dialihkan (percobaan lama) di bawah; tiap kelompok urut path.
      if (a.redirected !== b.redirected) return a.redirected ? 1 : -1;
      return a.path.localeCompare(b.path);
    });
}

/** Halaman terbit yang boleh dijadikan halaman depan. Beranda otomatis selalu ada. */
export async function listFrontPageChoices(): Promise<{ path: string; title: string }[]> {
  const rows = (await listAdminPages()).filter((p) => p.status === "published" && !p.redirected && !isDonationAppPath(p.path));
  const choices = rows.map((p) => ({ path: p.path, title: p.path === BUILTIN_FRONT_PAGE ? "Beranda" : p.title || p.path }));
  if (!choices.some((p) => p.path === BUILTIN_FRONT_PAGE)) choices.unshift({ path: BUILTIN_FRONT_PAGE, title: "Beranda" });
  return choices.sort((a, b) => (a.path === BUILTIN_FRONT_PAGE ? -1 : b.path === BUILTIN_FRONT_PAGE ? 1 : a.title.localeCompare(b.title, "id")));
}

export async function getEditorPage(id: number): Promise<EditorPage | null> {
  const [row] = await getDb().select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!row) return null;
  const { sections, issues } = parseSections(row.sections);
  const total = Array.isArray(row.sections) ? row.sections.length : 0;
  return {
    id: row.id,
    path: row.path,
    title: row.title,
    status: row.status,
    template: (PAGE_TEMPLATES as readonly string[]).includes(row.template) ? (row.template as PageTemplate) : "generic",
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    sections: sections.map(
      (s): EditorSection => ({ id: s.id, type: s.type, visible: s.visible, data: s.data as JsonObject, ...(s.en ? { en: s.en as JsonObject } : {}) }),
    ),
    dropped: issues.length ? total - sections.length : 0,
  };
}
