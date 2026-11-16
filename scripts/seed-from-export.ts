/**
 * Impor konten hasil ekspor WordPress (folder content/) ke database.
 *
 *   npm run db:seed
 *
 * Idempoten: semua baris di-upsert berdasarkan kunci alami (legacy_id / slug / path /
 * pathname / source / key), jadi aman dijalankan ulang setelah ekspor baru.
 * Post & halaman di path milik aplikasi donasi (/campaign, /donasi, /prog…) dilewati,
 * sama seperti di situs publik.
 *
 * Menulis ke database di DATABASE_URL (.env.local) — periksa dulu environment-nya.
 */

import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { inArray, sql } from "drizzle-orm";

import { legacyRedirects } from "../src/config/redirects";
import { isDonationAppPath } from "../src/config/routes";
import { contact, floatingContact, footerNav, mainNav, site, socials } from "../src/config/site";
import * as home from "../src/content/home";
import type { Page, PageSummary, Post, PostSummary, Term } from "../src/types/content";

loadEnvConfig(process.cwd());

const CONTENT_DIR = path.join(process.cwd(), "content");
const readJson = <T>(rel: string): T => JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, rel), "utf8")) as T;
const safeName = (p: string) => p.replace(/\//g, "__");
const chunk = <T>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/** Tanggal WordPress tanpa zona ("2026-11-11T09:12:00") adalah waktu Asia/Jakarta. */
const wibDate = (value: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}+07:00`);

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
  ".svg": "image/svg+xml", ".avif": "image/avif", ".pdf": "application/pdf", ".mp4": "video/mp4",
};
const mimeOf = (p: string) => MIME[path.extname(p).toLowerCase()] ?? "application/octet-stream";

async function main() {
  // Diimpor dinamis agar .env.local sudah termuat sebelum modul database dipakai.
  const { getDb, schema } = await import("../src/server/db");
  const db = getDb();
  const { categories, media, pages, postCategories, postTags, posts, redirects, settings, tags } = schema;

  const postSummaries = readJson<PostSummary[]>("posts/index.json").filter((p) => !isDonationAppPath(p.slug));
  const pageSummaries = readJson<PageSummary[]>("pages/index.json").filter((p) => !isDonationAppPath(p.path));
  const categoryTerms = readJson<Term[]>("categories.json");
  const tagTerms = readJson<Term[]>("tags.json");
  const manifest = readJson<string[]>("media-manifest.json");

  /* ---------- 1. Media lama ---------- */
  // Dimensi & alt hanya diketahui untuk gambar utama post; sisanya diisi saat dikelola di admin.
  const featured = new Map(postSummaries.flatMap((p) => (p.featuredImage ? [[p.featuredImage.src, p.featuredImage] as const] : [])));
  const mediaPaths = [...new Set([...manifest, ...featured.keys()])].filter((p) => p.startsWith("/wp-content/uploads/"));
  for (const part of chunk(mediaPaths, 500)) {
    await db
      .insert(media)
      .values(
        part.map((p) => {
          const f = featured.get(p);
          return { url: p, source: "legacy" as const, pathname: p.replace(/^\//, ""), mime: mimeOf(p), width: f?.width, height: f?.height, alt: f?.alt ?? "" };
        }),
      )
      .onConflictDoUpdate({
        target: media.pathname,
        set: {
          url: sql`excluded.url`,
          mime: sql`excluded.mime`,
          width: sql`coalesce(excluded.width, ${media.width})`,
          height: sql`coalesce(excluded.height, ${media.height})`,
          // alt yang sudah diisi admin tidak ditimpa
          alt: sql`case when ${media.alt} = '' then excluded.alt else ${media.alt} end`,
        },
      });
  }
  const mediaRows = await db.select({ id: media.id, url: media.url }).from(media).where(sql`${media.source} = 'legacy'`);
  const mediaIdByUrl = new Map(mediaRows.map((m) => [m.url, m.id]));
  console.log(`media      ${mediaPaths.length}`);

  /* ---------- 2. Kategori & tag ---------- */
  for (const part of chunk(categoryTerms, 500)) {
    await db
      .insert(categories)
      .values(part.map((c) => ({ legacyId: c.id, slug: c.slug, path: c.path, name: c.name, description: c.description })))
      .onConflictDoUpdate({ target: categories.legacyId, set: { slug: sql`excluded.slug`, path: sql`excluded.path`, name: sql`excluded.name`, description: sql`excluded.description` } });
  }
  const categoryRows = await db.select({ id: categories.id, legacyId: categories.legacyId, slug: categories.slug }).from(categories);
  const categoryIdByLegacy = new Map(categoryRows.map((c) => [c.legacyId, c.id]));
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));
  for (const c of categoryTerms) {
    await db.update(categories).set({ parentId: c.parent ? (categoryIdByLegacy.get(c.parent) ?? null) : null }).where(sql`${categories.legacyId} = ${c.id}`);
  }

  for (const part of chunk(tagTerms, 500)) {
    await db
      .insert(tags)
      .values(part.map((t) => ({ legacyId: t.id, slug: t.slug, name: t.name, description: t.description })))
      .onConflictDoUpdate({ target: tags.legacyId, set: { slug: sql`excluded.slug`, name: sql`excluded.name`, description: sql`excluded.description` } });
  }
  const tagRows = await db.select({ id: tags.id, slug: tags.slug }).from(tags);
  const tagIdBySlug = new Map(tagRows.map((t) => [t.slug, t.id]));
  console.log(`kategori   ${categoryTerms.length}\ntag        ${tagTerms.length}`);

  /* ---------- 3. Post + relasi ---------- */
  const fullPosts = postSummaries.map((s) => readJson<Post>(`posts/${safeName(s.slug)}.json`));
  for (const part of chunk(fullPosts, 25)) {
    await db
      .insert(posts)
      .values(
        part.map((p) => ({
          legacyId: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          contentHtml: p.html,
          status: "published" as const,
          publishedAt: wibDate(p.date),
          featuredMediaId: p.featuredImage ? (mediaIdByUrl.get(p.featuredImage.src) ?? null) : null,
          seoTitle: p.seo.title || null,
          seoDescription: p.seo.description || null,
          ogImage: p.seo.ogImage ?? null,
          canonical: p.seo.canonical || null,
          robots: p.seo.robots || null,
          legacyJsonld: p.seo.jsonLd ?? null,
          createdAt: wibDate(p.date),
          updatedAt: wibDate(p.modified),
        })),
      )
      .onConflictDoUpdate({
        target: posts.legacyId,
        set: {
          slug: sql`excluded.slug`, title: sql`excluded.title`, excerpt: sql`excluded.excerpt`, contentHtml: sql`excluded.content_html`,
          publishedAt: sql`excluded.published_at`, featuredMediaId: sql`excluded.featured_media_id`, seoTitle: sql`excluded.seo_title`,
          seoDescription: sql`excluded.seo_description`, ogImage: sql`excluded.og_image`, canonical: sql`excluded.canonical`,
          robots: sql`excluded.robots`, legacyJsonld: sql`excluded.legacy_jsonld`, updatedAt: sql`excluded.updated_at`,
        },
      });
  }
  const postRows = await db.select({ id: posts.id, legacyId: posts.legacyId }).from(posts).where(sql`${posts.legacyId} is not null`);
  const postIdByLegacy = new Map(postRows.map((p) => [p.legacyId, p.id]));

  // Relasi post hasil migrasi diganti seluruhnya dengan isi ekspor.
  const seededIds = fullPosts.flatMap((p) => postIdByLegacy.get(p.id) ?? []);
  const catLinks = fullPosts.flatMap((p) => p.categories.flatMap((c) => { const postId = postIdByLegacy.get(p.id); const categoryId = categoryIdBySlug.get(c.slug); return postId && categoryId ? [{ postId, categoryId }] : []; }));
  const tagLinks = fullPosts.flatMap((p) => p.tags.flatMap((t) => { const postId = postIdByLegacy.get(p.id); const tagId = tagIdBySlug.get(t.slug); return postId && tagId ? [{ postId, tagId }] : []; }));
  await db.transaction(async (tx) => {
    for (const ids of chunk(seededIds, 500)) {
      await tx.delete(postCategories).where(inArray(postCategories.postId, ids));
      await tx.delete(postTags).where(inArray(postTags.postId, ids));
    }
    for (const part of chunk(catLinks, 1000)) await tx.insert(postCategories).values(part).onConflictDoNothing();
    for (const part of chunk(tagLinks, 1000)) await tx.insert(postTags).values(part).onConflictDoNothing();
  });
  console.log(`post       ${fullPosts.length} (${catLinks.length} relasi kategori, ${tagLinks.length} relasi tag)`);

  /* ---------- 4. Halaman ---------- */
  const fullPages = pageSummaries.map((s) => readJson<Page>(`pages/${safeName(s.path)}.json`));
  for (const part of chunk(fullPages, 25)) {
    await db
      .insert(pages)
      .values(
        part.map((p) => ({
          legacyId: p.id,
          path: p.path,
          title: p.title,
          template: "generic",
          // Satu section "richtext" berisi HTML ekspor; dipecah menjadi section terstruktur di B7.
          sections: [{ type: "richtext", visible: true, data: { html: p.html } }],
          status: "published" as const,
          seoTitle: p.seo.title || null,
          seoDescription: p.seo.description || null,
          ogImage: p.seo.ogImage ?? null,
          canonical: p.seo.canonical || null,
          robots: p.seo.robots || null,
          updatedAt: wibDate(p.modified),
        })),
      )
      .onConflictDoUpdate({
        target: pages.path,
        set: {
          legacyId: sql`excluded.legacy_id`, title: sql`excluded.title`, sections: sql`excluded.sections`, seoTitle: sql`excluded.seo_title`,
          seoDescription: sql`excluded.seo_description`, ogImage: sql`excluded.og_image`, canonical: sql`excluded.canonical`,
          robots: sql`excluded.robots`, updatedAt: sql`excluded.updated_at`,
        },
      });
  }
  console.log(`halaman    ${fullPages.length}`);

  /* ---------- 5. Redirect ---------- */
  await db
    .insert(redirects)
    .values(legacyRedirects.map((r) => ({ source: r.source, destination: r.destination, statusCode: r.statusCode, note: r.source.includes(":") ? "Pola (ditangani next.config)" : "Migrasi WordPress" })))
    .onConflictDoUpdate({ target: redirects.source, set: { destination: sql`excluded.destination`, statusCode: sql`excluded.status_code`, note: sql`excluded.note` } });
  console.log(`redirect   ${legacyRedirects.length}`);

  /* ---------- 6. Pengaturan ---------- */
  const settingRows = [
    { key: "identity", value: site },
    { key: "contact", value: contact },
    { key: "socials", value: socials },
    { key: "menu", value: { main: mainNav, footer: footerNav } },
    { key: "integrations", value: { donateUrl: site.donateUrl, floatingContact } },
    { key: "home", value: { ...home } },
  ];
  // Pengaturan yang sudah ada TIDAK ditimpa — setelah seed pertama, admin yang mengelolanya.
  await db.insert(settings).values(settingRows).onConflictDoNothing();
  console.log(`pengaturan ${settingRows.length} kunci (yang sudah ada tidak ditimpa)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
