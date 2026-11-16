/**
 * Muat terjemahan artikel dari content/translations/<bahasa>/posts/*.json ke tabel
 * post_translations.
 *
 *   npm run db:seed:translations
 *
 * Format file (satu per artikel, nama file = slug):
 *   { "slug", "sourceModified", "title", "excerpt", "html", "seoTitle"?, "seoDescription"?, "status"? }
 * `status`: "draft" (bawaan) atau "reviewed". Sampai editor admin tersedia, file inilah
 * sumber kebenaran: tim meninjau/menyunting file, mengubah status menjadi "reviewed",
 * lalu menjalankan skrip ini lagi. Hanya terjemahan "reviewed" yang diindeks mesin pencari.
 * Idempoten (upsert per post + bahasa). Menulis ke database di DATABASE_URL.
 */

import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { inArray, sql } from "drizzle-orm";

loadEnvConfig(process.cwd());

const ROOT = path.join(process.cwd(), "content", "translations");

type TranslationFile = {
  slug: string;
  sourceModified?: string;
  title: string;
  excerpt?: string;
  html: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: "draft" | "reviewed";
};

async function main() {
  const { getDb, schema } = await import("../src/server/db");
  const db = getDb();
  const { posts, postTranslations } = schema;

  const locales = fs.existsSync(ROOT) ? fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, "posts"))) : [];
  for (const locale of locales) {
    const dir = path.join(ROOT, locale, "posts");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    const items = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as TranslationFile);
    if (!items.length) continue;

    const rows = await db.select({ id: posts.id, slug: posts.slug }).from(posts).where(inArray(posts.slug, items.map((i) => i.slug)));
    const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));
    const missing = items.filter((i) => !idBySlug.has(i.slug)).map((i) => i.slug);
    const invalid = items.filter((i) => !i.title?.trim() || !i.html?.trim()).map((i) => i.slug);
    if (missing.length) console.warn(`  dilewati (slug tidak ada di database): ${missing.join(", ")}`);
    if (invalid.length) console.warn(`  dilewati (title/html kosong): ${invalid.join(", ")}`);

    const values = items
      .filter((i) => idBySlug.has(i.slug) && !invalid.includes(i.slug))
      .map((i) => ({
        postId: idBySlug.get(i.slug) as number,
        locale,
        title: i.title.trim(),
        excerpt: i.excerpt?.trim() ?? "",
        contentHtml: i.html,
        seoTitle: i.seoTitle?.trim() || null,
        seoDescription: i.seoDescription?.trim() || null,
        status: i.status === "reviewed" ? ("reviewed" as const) : ("draft" as const),
        sourceUpdatedAt: i.sourceModified ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(i.sourceModified) ? i.sourceModified : `${i.sourceModified}+07:00`) : null,
      }));
    for (let n = 0; n < values.length; n += 25) {
      await db
        .insert(postTranslations)
        .values(values.slice(n, n + 25))
        .onConflictDoUpdate({
          target: [postTranslations.postId, postTranslations.locale],
          set: {
            title: sql`excluded.title`, excerpt: sql`excluded.excerpt`, contentHtml: sql`excluded.content_html`, seoTitle: sql`excluded.seo_title`,
            seoDescription: sql`excluded.seo_description`, status: sql`excluded.status`, sourceUpdatedAt: sql`excluded.source_updated_at`, updatedAt: sql`now()`,
          },
        });
    }
    const reviewed = values.filter((v) => v.status === "reviewed").length;
    console.log(`${locale}: ${values.length} terjemahan artikel dimuat (${reviewed} sudah ditinjau, ${values.length - reviewed} draf)`);
  }
  if (!locales.length) console.log("Belum ada folder content/translations/<bahasa>/posts.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
