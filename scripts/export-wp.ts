/**
 * Ekspor konten WordPress relawannusantara.org → /content (JSON) + /public/wp-content/uploads.
 *
 * Jalankan dari mesin yang bisa mengakses situs:
 *   npm run export            # ekspor penuh (taksonomi, post, halaman, media)
 *   npm run export -- --limit=20 --skip-media   # uji cepat
 *
 * Sumber data:
 *   - WordPress REST API (/wp-json/wp/v2) untuk metadata, taksonomi, featured image.
 *   - HTML publik tiap URL untuk (a) konten yang SUDAH dirender Divi — REST API hanya
 *     mengembalikan shortcode [et_pb_*] mentah — dan (b) meta SEO Rank Math di <head>.
 *
 * Konten TIDAK ditulis ulang: hanya dibersihkan dari markup Divi (wrapper, style, script)
 * dengan whitelist tag/atribut. Path media dipertahankan (/wp-content/uploads/...).
 */

import fs from "node:fs/promises";
import path from "node:path";

import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";

import {
  CONTENT_ALLOWED_ATTRIBUTES,
  CONTENT_ALLOWED_IFRAME_HOSTS,
  CONTENT_ALLOWED_SCHEMES,
  CONTENT_ALLOWED_TAGS,
  CONTENT_NON_TEXT_TAGS,
} from "../src/lib/html-whitelist";

/* ---------------------------------------------------------------- config */

const ORIGIN = (process.env.WP_ORIGIN ?? "https://relawannusantara.org").replace(/\/$/, "");
const API = `${ORIGIN}/wp-json/wp/v2`;
const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const PUBLIC_DIR = path.join(ROOT, "public");
const CONCURRENCY = Number(process.env.EXPORT_CONCURRENCY ?? 6);

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"] as const;
  }),
);
const LIMIT = args.has("limit") ? Number(args.get("limit")) : Infinity;
const SKIP_MEDIA = args.has("skip-media");

const UA = "Mozilla/5.0 (compatible; RN-NextExport/1.0; +https://relawannusantara.org)";

const warnings: string[] = [];
const mediaUrls = new Set<string>();

/* ---------------------------------------------------------------- utils */

async function fetchRetry(url: string, init: RequestInit = {}, tries = 4): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...(init.headers ?? {}) } });
      if (res.status >= 500 && i < tries) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 800 * i));
    }
  }
}

async function getJson<T>(url: string): Promise<{ data: T; totalPages: number }> {
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return { data: (await res.json()) as T, totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1) };
}

async function getAll<T>(endpoint: string, query = ""): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; ; page++) {
    const { data, totalPages } = await getJson<T[]>(`${API}/${endpoint}?per_page=100&page=${page}${query}`);
    out.push(...data);
    process.stdout.write(`\r  ${endpoint}: ${out.length}`);
    if (page >= totalPages || out.length >= LIMIT) break;
  }
  process.stdout.write("\n");
  return out.slice(0, LIMIT);
}

async function pool<T, R>(items: T[], fn: (item: T, i: number) => Promise<R>, label: string): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
        process.stdout.write(`\r  ${label}: ${++done}/${items.length}`);
      }
    }),
  );
  process.stdout.write("\n");
  return results;
}

const decode = (html: string) => cheerio.load(`<div>${html}</div>`)("div").text().trim();

/** URL absolut situs → path relatif; catat media untuk diunduh. */
function localize(url: string | undefined): string {
  if (!url) return "";
  // URL yang tertangkap dari string JSON di HTML (mis. JSON-LD) masih ber-escape \uXXXX / \/
  let u = url
    .trim()
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\\//g, "/");
  if (u.startsWith("//")) u = `https:${u}`;
  const m = u.match(/^https?:\/\/(?:www\.)?relawannusantara\.org(\/[^"'\s)]*)?/i);
  if (m) u = m[1] || "/";
  if (u.startsWith("/wp-content/uploads/")) {
    const clean = u.split(/[?#]/)[0];
    mediaUrls.add(clean);
    return clean;
  }
  return u;
}

function pathOf(link: string): string {
  return new URL(link).pathname.replace(/^\/|\/$/g, "");
}

async function writeJson(rel: string, data: unknown) {
  const file = path.join(CONTENT_DIR, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

const safeName = (p: string) => p.replace(/\//g, "__");

/* ---------------------------------------------------------------- SEO (Rank Math <head>) */

type Seo = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: unknown[];
};

function extractSeo($: cheerio.CheerioAPI): Seo {
  const meta = (sel: string) => $(sel).attr("content")?.trim() || undefined;
  const jsonLd: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(JSON.parse($(el).text()));
    } catch {
      /* abaikan JSON-LD rusak */
    }
  });
  const ogImage = meta('meta[property="og:image"]');
  return {
    title: $("title").first().text().trim(),
    description: meta('meta[name="description"]') ?? "",
    canonical: localize($('link[rel="canonical"]').attr("href")),
    robots: meta('meta[name="robots"]') ?? "",
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    ogImage: ogImage ? localize(ogImage) : undefined,
    ogType: meta('meta[property="og:type"]'),
    publishedTime: meta('meta[property="article:published_time"]'),
    modifiedTime: meta('meta[property="article:modified_time"]'),
    jsonLd,
  };
}

/* ---------------------------------------------------------------- HTML sanitizer */

const ALLOWED_IFRAME_HOSTS = CONTENT_ALLOWED_IFRAME_HOSTS;

function cleanContent(rawHtml: string, ctx: string): string {
  const $ = cheerio.load(rawHtml, null, false);

  // Gambar: pilih src asli (Divi kadang memakai lazy data-src) & lokalkan.
  $("img").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("data-src") || $el.attr("data-lazy-src") || $el.attr("src");
    $el.attr("src", localize(src));
    ($el.attr("srcset") ?? "")
      .split(",")
      .map((s) => s.trim().split(/\s+/)[0])
      .filter(Boolean)
      .forEach((u) => localize(u));
  });

  // Background image inline (Divi) → catat agar ikut diunduh.
  $("[style*='url(']").each((_, el) => {
    for (const m of ($(el).attr("style") ?? "").matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) localize(m[1]);
  });

  // Tombol Divi → link bergaya tombol.
  $("a.et_pb_button").each((_, el) => {
    $(el).attr("data-button", "true");
  });

  // Galeri Divi: ambil gambar penuh dari link lightbox.
  $(".et_pb_gallery_item a").each((_, el) => {
    const href = $(el).attr("href");
    if (href?.includes("/wp-content/uploads/")) localize(href);
  });

  // Accordion/toggle Divi → <details>.
  $(".et_pb_toggle, .et_pb_accordion_item").each((_, el) => {
    const $el = $(el);
    const title = $el.find(".et_pb_toggle_title").first().text().trim();
    const body = $el.find(".et_pb_toggle_content").first().html() ?? "";
    $el.replaceWith(`<details><summary>${title}</summary>${body}</details>`);
  });

  const html = $.html();

  const clean = sanitizeHtml(html, {
    allowedTags: CONTENT_ALLOWED_TAGS,
    allowedAttributes: CONTENT_ALLOWED_ATTRIBUTES,
    allowedSchemes: CONTENT_ALLOWED_SCHEMES,
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
    nonTextTags: CONTENT_NON_TEXT_TAGS,
    transformTags: {
      // Satu-satunya H1 adalah judul di hero → H1 konten diturunkan jadi H2.
      h1: "h2",
      a: (tagName, attribs) => {
        const href = localize(attribs.href);
        const external = /^https?:\/\//.test(href);
        return {
          tagName,
          attribs: {
            href,
            ...(attribs["data-button"] ? { "data-button": "true" } : {}),
            ...(external || attribs.target === "_blank" ? { target: "_blank", rel: "noopener noreferrer" } : {}),
          },
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
    exclusiveFilter: (frame) =>
      (frame.tag === "p" && !frame.text.trim() && !frame.mediaChildren.length) ||
      (frame.tag === "a" && !frame.text.trim() && !frame.mediaChildren.length) ||
      (frame.tag === "img" && !frame.attribs.src),
  });

  if (/\[et_pb_[a-z_]+/.test(clean)) warnings.push(`${ctx}: masih mengandung shortcode Divi mentah`);
  return clean.replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------------------------------------------------------------- page fetch */

/** Ambil HTML publik → { seo, contentHtml }. */
async function scrape(url: string, ctx: string, kind: "post" | "page") {
  let res: Response;
  try {
    res = await fetchRetry(url);
  } catch (err) {
    warnings.push(`${ctx}: gagal diambil (${(err as Error).message}) — jalankan ulang ekspor`);
    return null;
  }
  if (!res.ok) {
    warnings.push(`${ctx}: HTTP ${res.status} ${url}`);
    return null;
  }
  let html: string;
  try {
    html = await res.text();
  } catch (err) {
    warnings.push(`${ctx}: koneksi terputus saat membaca (${(err as Error).message}) — jalankan ulang ekspor`);
    return null;
  }
  const $ = cheerio.load(html);
  const seo = extractSeo($);

  // Semua media yang dirujuk halaman (termasuk background di <style> Divi & slider).
  for (const m of html.matchAll(/(?:https?:)?\/\/(?:www\.)?relawannusantara\.org\/wp-content\/uploads\/[^"'\s)?#,]+/gi)) {
    localize(m[0]);
  }

  let content: string | undefined;
  if (kind === "post") {
    content =
      $(".et-l--body .rk-post-content").first().html() ??
      $(".et-l--body .et_pb_post_content").first().html() ??
      $(".entry-content").first().html() ??
      undefined;
  } else {
    content = $("#main-content .et-l--post").first().html() ?? $(".entry-content").first().html() ?? undefined;
  }
  if (!content) warnings.push(`${ctx}: konten tidak ditemukan di HTML`);
  return { seo, contentHtml: content ? cleanContent(content, ctx) : "" };
}

/* ---------------------------------------------------------------- types (REST) */

type WpTerm = { id: number; slug: string; name: string; description: string; count: number; parent: number; link: string };
type WpMedia = { source_url: string; alt_text: string; media_details?: { width?: number; height?: number } };
type WpPost = {
  id: number; slug: string; link: string; date: string; modified: string; status: string;
  title: { rendered: string }; excerpt: { rendered: string };
  categories: number[]; tags: number[]; featured_media: number;
  _embedded?: { "wp:featuredmedia"?: (WpMedia & { code?: string })[] };
};
type WpPage = Omit<WpPost, "categories" | "tags" | "excerpt"> & { parent: number };

function mediaRef(m: WpMedia | undefined, fallbackAlt: string) {
  if (!m?.source_url) return null;
  return {
    src: localize(m.source_url),
    width: m.media_details?.width ?? 1200,
    height: m.media_details?.height ?? 675,
    alt: decode(m.alt_text || "") || fallbackAlt,
  };
}

/* ---------------------------------------------------------------- media download */

const MEDIA_CONCURRENCY = Number(process.env.MEDIA_CONCURRENCY ?? 3);
const MEDIA_RETRIES = 6;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Unduh satu file dengan retry yang mencakup PEMBACAAN BODY (ECONNRESET sering
 * terjadi di tengah transfer, bukan saat request). Ditulis ke .part lalu di-rename
 * supaya file setengah jadi tidak pernah dianggap selesai.
 */
async function downloadOne(rel: string, dest: string): Promise<{ ok: true; size: number } | { ok: false; reason: string }> {
  let lastErr = "";
  for (let i = 1; i <= MEDIA_RETRIES; i++) {
    try {
      const res = await fetch(`${ORIGIN}${encodeURI(decodeURI(rel))}`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(120_000),
      });
      if (res.status === 404 || res.status === 410) return { ok: false, reason: `${res.status}` };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(`${dest}.part`, buf);
      await fs.rename(`${dest}.part`, dest);
      return { ok: true, size: buf.length };
    } catch (err) {
      lastErr = (err as Error & { cause?: { code?: string } }).cause?.code ?? (err as Error).message;
      await sleep(1000 * 2 ** (i - 1)); // 1s, 2s, 4s, 8s, 16s, 32s
    }
  }
  return { ok: false, reason: lastErr };
}

async function downloadMedia(list: string[]) {
  let bytes = 0;
  let skipped = 0;
  let downloaded = 0;
  const failed: string[] = [];
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(MEDIA_CONCURRENCY, list.length) }, async () => {
      while (next < list.length) {
        const rel = list[next++];
        const dest = path.join(PUBLIC_DIR, decodeURIComponent(rel));
        try {
          const stat = await fs.stat(dest);
          if (stat.size > 0) {
            bytes += stat.size;
            skipped++;
            process.stdout.write(`\r  media: ${++done}/${list.length} (gagal ${failed.length})`);
            continue;
          }
        } catch {
          /* belum ada */
        }
        const r = await downloadOne(rel, dest);
        if (r.ok) {
          bytes += r.size;
          downloaded++;
        } else {
          failed.push(`${r.reason} ${rel}`);
        }
        process.stdout.write(`\r  media: ${++done}/${list.length} (gagal ${failed.length})`);
      }
    }),
  );
  process.stdout.write("\n");
  await writeJson("media-failed.json", failed);
  failed.forEach((f) => warnings.push(`media gagal: ${f}`));
  return { files: list.length, downloaded, skipped, failed: failed.length, megabytes: +(bytes / 1048576).toFixed(1) };
}

/* ---------------------------------------------------------------- main */

/** `--media-only`: lanjutkan unduhan media dari content/media-manifest.json tanpa scraping ulang. */
async function mediaOnly() {
  const file = path.join(CONTENT_DIR, "media-manifest.json");
  let manifest: string[];
  try {
    manifest = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    console.error("content/media-manifest.json belum ada — jalankan `npm run export` penuh sekali dulu.");
    process.exit(1);
  }
  const only = args.get("only-failed") === "true";
  const list = only ? (JSON.parse(await fs.readFile(path.join(CONTENT_DIR, "media-failed.json"), "utf8")) as string[]).map((l) => l.split(" ").pop()!) : manifest;
  console.log(`Melanjutkan unduhan ${list.length} media dari ${ORIGIN} (paralel ${MEDIA_CONCURRENCY})`);
  const media = await downloadMedia(list);
  console.log(JSON.stringify(media, null, 2));
  if (media.failed) console.log("Daftar gagal: content/media-failed.json — ulangi dengan `npm run export -- --media-only --only-failed`.");
}

async function main() {
  if (args.has("media-only")) return mediaOnly();

  console.log(`Ekspor dari ${ORIGIN}`);
  await fs.mkdir(CONTENT_DIR, { recursive: true });

  // 1. Taksonomi
  const categories = await getAll<WpTerm>("categories", "&_fields=id,slug,name,description,count,parent,link");
  const tags = await getAll<WpTerm>("tags", "&_fields=id,slug,name,description,count,parent,link");
  const toTerm = (t: WpTerm, base: "category" | "tag") => ({
    id: t.id,
    slug: t.slug,
    path: pathOf(t.link).replace(new RegExp(`^${base}/`), ""),
    name: decode(t.name),
    description: decode(t.description),
    count: t.count,
    parent: t.parent,
  });
  const catTerms = categories.map((c) => toTerm(c, "category"));
  const tagTerms = tags.map((t) => toTerm(t, "tag"));
  await writeJson("categories.json", catTerms);
  await writeJson("tags.json", tagTerms);
  const catById = new Map(catTerms.map((c) => [c.id, { slug: c.slug, name: c.name }]));
  const tagById = new Map(tagTerms.map((t) => [t.id, { slug: t.slug, name: t.name }]));

  // 2. Posts
  const posts = await getAll<WpPost>("posts", "&_embed=wp:featuredmedia&status=publish");
  const summaries = await pool(
    posts,
    async (p) => {
      const title = decode(p.title.rendered);
      const scraped = await scrape(p.link, `post:${p.slug}`, "post");
      const excerpt = decode(p.excerpt.rendered).replace(/\s*\[(?:&hellip;|…|\.\.\.)\]\s*$/, "…");
      const summary = {
        id: p.id,
        slug: p.slug,
        title,
        date: p.date,
        modified: p.modified,
        excerpt: excerpt || scraped?.seo.description || "",
        // Sebagian post tidak mengembalikan featured media lewat REST padahal temanya menampilkan
        // gambar utama; og:image Rank Math (gambar yang sama) dipakai sebagai cadangan.
        featuredImage:
          mediaRef(p._embedded?.["wp:featuredmedia"]?.[0], title) ??
          (scraped?.seo.ogImage ? { src: scraped.seo.ogImage, width: 1200, height: 675, alt: title } : null),
        categories: p.categories.map((id) => catById.get(id)).filter(Boolean),
        tags: p.tags.map((id) => tagById.get(id)).filter(Boolean),
      };
      if (pathOf(p.link) !== p.slug) warnings.push(`post:${p.slug}: permalink tidak di root (${p.link})`);
      await writeJson(`posts/${safeName(p.slug)}.json`, {
        ...summary,
        html: scraped?.contentHtml ?? "",
        seo: scraped?.seo ?? { title: "", description: "", canonical: "", robots: "" },
      });
      return summary;
    },
    "posts",
  );
  summaries.sort((a, b) => b.date.localeCompare(a.date));
  await writeJson("posts/index.json", summaries);

  // 3. Pages
  const pages = await getAll<WpPage>("pages", "&status=publish&_fields=id,slug,link,title,modified,parent,date,status");
  const pageSummaries = await pool(
    pages,
    async (p) => {
      const pagePath = pathOf(p.link) || p.slug;
      const scraped = await scrape(p.link, `page:${pagePath}`, "page");
      const summary = { id: p.id, path: pagePath, slug: p.slug, title: decode(p.title.rendered), modified: p.modified };
      await writeJson(`pages/${safeName(pagePath)}.json`, {
        ...summary,
        html: scraped?.contentHtml ?? "",
        seo: scraped?.seo ?? { title: "", description: "", canonical: "", robots: "" },
      });
      return summary;
    },
    "pages",
  );
  await writeJson("pages/index.json", pageSummaries);

  // 4. Ikon situs (favicon/apple-touch) dari <head> beranda
  const home = cheerio.load(await (await fetchRetry(`${ORIGIN}/`)).text());
  const icons = home('link[rel="icon"], link[rel="apple-touch-icon"]')
    .map((_, el) => ({ rel: home(el).attr("rel"), href: localize(home(el).attr("href")), sizes: home(el).attr("sizes") }))
    .get()
    .filter((i) => i.href.startsWith("/wp-content/uploads/"));
  await writeJson("site.json", { icons });

  // 5. Media — manifest ditulis DULU agar `--media-only` bisa melanjutkan bila terputus
  const manifest = [...mediaUrls].sort();
  await writeJson("media-manifest.json", manifest);
  const media = SKIP_MEDIA ? { skipped: "dilewati (--skip-media)", files: manifest.length } : await downloadMedia(manifest);

  // 6. Laporan
  const report = {
    exportedAt: new Date().toISOString(),
    origin: ORIGIN,
    counts: { posts: summaries.length, pages: pageSummaries.length, categories: catTerms.length, tags: tagTerms.length },
    media,
    warnings,
  };
  await writeJson("export-report.json", report);
  console.log(JSON.stringify({ ...report, warnings: `${warnings.length} peringatan (lihat content/export-report.json)` }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
