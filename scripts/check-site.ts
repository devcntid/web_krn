/**
 * Pemeriksa SEO & tautan pada situs yang sedang berjalan.
 *
 *   npm run check:site                          # terhadap http://localhost:3000
 *   CHECK_ORIGIN=http://localhost:3111 npm run check:site
 *
 * Meng-crawl SEMUA URL di /sitemap.xml lalu memeriksa:
 *  - status HTTP, satu <h1>, title, meta description, canonical (= URL sitemap)
 *  - JSON-LD: bisa di-parse; beranda punya WebSite+SearchAction & organisasi;
 *    post punya BlogPosting/Article; halaman & kategori punya BreadcrumbList
 *  - robots.txt (aturan + baris Sitemap)
 *  - tautan internal rusak (termasuk yang hanya redirect) dan gambar rusak
 * Path milik aplikasi donasi (/campaign, /donasi, /prog…) tidak dilayani aplikasi
 * ini, jadi hanya dihitung. Hasil: qa/site-check.json + ringkasan di terminal.
 */

import fs from "node:fs";
import path from "node:path";

import * as cheerio from "cheerio";

import { SITE_URL } from "../src/config/site";
import { isDonationAppPath } from "../src/config/routes";

const ORIGIN = (process.env.CHECK_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
const OUT_FILE = path.join(process.cwd(), "qa", "site-check.json");
const CONCURRENCY = 8;

type PageIssue = { url: string; problem: string };

async function pool<T>(items: T[], worker: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) await worker(items[next++]);
    }),
  );
}

async function get(pathname: string, method: "GET" | "HEAD" = "GET") {
  return fetch(ORIGIN + pathname, { method, redirect: "manual", headers: { "user-agent": "krn-check-site" } });
}

/** Kumpulkan semua nilai @type (termasuk di dalam @graph dan objek bersarang). */
function schemaTypes(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) node.forEach((n) => schemaTypes(n, out));
  else if (node && typeof node === "object") {
    const type = (node as Record<string, unknown>)["@type"];
    if (typeof type === "string") out.push(type);
    else if (Array.isArray(type)) out.push(...type.filter((t): t is string => typeof t === "string"));
    Object.values(node).forEach((v) => schemaTypes(v, out));
  }
  return out;
}

function kindOf(pathname: string, postPaths: Set<string>): "home" | "post" | "category" | "page" {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/category/")) return "category";
  return postPaths.has(pathname) ? "post" : "page";
}

async function main() {
  const issues: PageIssue[] = [];
  const add = (url: string, problem: string): void => {
    issues.push({ url, problem });
  };

  /* ---------- robots.txt ---------- */
  const robotsRes = await get("/robots.txt");
  const robots = await robotsRes.text();
  const robotsOk = robotsRes.status === 200 && /User-Agent:\s*\*/i.test(robots) && robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`);
  if (!robotsOk) add("/robots.txt", "aturan User-Agent atau baris Sitemap tidak sesuai");

  /* ---------- sitemap ---------- */
  const sitemapRes = await get("/sitemap.xml");
  const sitemap = await sitemapRes.text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  if (sitemapRes.status !== 200 || !locs.length) throw new Error(`sitemap.xml tidak terbaca dari ${ORIGIN}`);
  const paths = locs.map((loc) => (loc.startsWith(SITE_URL) ? loc.slice(SITE_URL.length) || "/" : loc));
  for (const p of paths) if (!p.startsWith("/")) add(p, "URL sitemap di luar domain situs");
  if (new Set(paths).size !== paths.length) add("/sitemap.xml", "ada URL ganda di sitemap");

  const postsIndex = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "posts", "index.json"), "utf8")) as { slug: string }[];
  const postPaths = new Set(postsIndex.map((p) => `/${p.slug}/`));

  /* ---------- crawl halaman ---------- */
  const crawled = new Set(paths);
  const linkSources = new Map<string, string>(); // target → halaman pertama yang menautkannya
  const imageSources = new Map<string, string>();
  const typeTally = new Map<string, number>();
  let donationLinks = 0;
  let done = 0;

  await pool(paths.filter((p) => p.startsWith("/")), async (pathname) => {
    const res = await get(pathname);
    if (++done % 100 === 0) console.log(`  ${done}/${paths.length} halaman…`);
    if (res.status !== 200) return add(pathname, `status ${res.status}`);
    const $ = cheerio.load(await res.text());

    const h1 = $("h1").length;
    if (h1 !== 1) add(pathname, `${h1} elemen <h1>`);
    if (!$("title").text().trim()) add(pathname, "title kosong");
    if (!($('meta[name="description"]').attr("content") ?? "").trim()) add(pathname, "meta description kosong");
    const canonical = $('link[rel="canonical"]').attr("href");
    if (canonical !== SITE_URL + pathname) add(pathname, `canonical ${canonical ?? "tidak ada"}`);
    if (/noindex/i.test($('meta[name="robots"]').attr("content") ?? "")) add(pathname, "noindex tetapi ada di sitemap");

    const types: string[] = [];
    let searchAction = false;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data: unknown = JSON.parse($(el).text());
        schemaTypes(data, types);
        if (JSON.stringify(data).includes('"SearchAction"')) searchAction = true;
      } catch {
        add(pathname, "JSON-LD tidak valid (gagal di-parse)");
      }
    });
    for (const t of new Set(types)) typeTally.set(t, (typeTally.get(t) ?? 0) + 1);
    const has = (...names: string[]) => names.some((n) => types.includes(n));
    if (!has("Organization", "NGO")) add(pathname, "JSON-LD organisasi tidak ada");
    const kind = kindOf(pathname, postPaths);
    if (kind === "home" && !(has("WebSite") && searchAction)) add(pathname, "JSON-LD WebSite + SearchAction tidak ada");
    if (kind === "post" && !has("BlogPosting", "Article", "NewsArticle")) add(pathname, "JSON-LD BlogPosting/Article tidak ada");
    if ((kind === "page" || kind === "category") && !has("BreadcrumbList")) add(pathname, "JSON-LD BreadcrumbList tidak ada");

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (!href || href.startsWith("#") || /^(mailto|tel|sms|javascript):/i.test(href)) return;
      let url: URL;
      try {
        url = new URL(href, SITE_URL + pathname);
      } catch {
        return add(pathname, `href tidak valid: ${href.slice(0, 80)}`);
      }
      if (url.origin !== SITE_URL) return;
      if (isDonationAppPath(url.pathname)) {
        donationLinks++;
        return;
      }
      const target = url.pathname + (url.pathname === "/" && url.searchParams.has("s") ? url.search : "");
      if (!crawled.has(url.pathname) && !linkSources.has(target)) linkSources.set(target, pathname);
    });

    $("img").each((_, el) => {
      const src = $(el).attr("src") ?? "";
      let file = src;
      if (src.startsWith("/_next/image")) file = new URL(src, SITE_URL).searchParams.get("url") ?? "";
      if (file.startsWith("/") && !imageSources.has(file)) imageSources.set(file, pathname);
    });
  });

  /* ---------- tautan & gambar di luar sitemap ---------- */
  const brokenLinks: { target: string; from: string; status: number }[] = [];
  const redirectedLinks: { target: string; from: string; to: string }[] = [];
  await pool([...linkSources.entries()], async ([target, from]) => {
    const res = await get(target);
    if (res.status >= 300 && res.status < 400) redirectedLinks.push({ target, from, to: res.headers.get("location") ?? "" });
    else if (res.status !== 200) brokenLinks.push({ target, from, status: res.status });
  });

  const brokenImages: { src: string; from: string; status: number }[] = [];
  await pool([...imageSources.entries()], async ([src, from]) => {
    const res = await get(encodeURI(decodeURI(src)), "HEAD");
    if (res.status !== 200) brokenImages.push({ src, from, status: res.status });
  });

  /* ---------- hasil ---------- */
  const byProblem = new Map<string, number>();
  for (const i of issues) {
    const key = i.problem.replace(/ https?:\S+| \/\S+|\d+ elemen/g, "").trim();
    byProblem.set(key, (byProblem.get(key) ?? 0) + 1);
  }
  const report = {
    generatedAt: new Date().toISOString(),
    origin: ORIGIN,
    totals: {
      sitemapUrls: paths.length,
      pagesWithIssues: new Set(issues.map((i) => i.url)).size,
      internalLinksOutsideSitemap: linkSources.size,
      brokenLinks: brokenLinks.length,
      redirectedLinks: redirectedLinks.length,
      imagesChecked: imageSources.size,
      brokenImages: brokenImages.length,
      donationAppLinks: donationLinks,
      robotsOk,
    },
    schemaTypes: Object.fromEntries([...typeTally.entries()].sort((a, b) => b[1] - a[1])),
    issues,
    brokenLinks,
    redirectedLinks,
    brokenImages,
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`\nSitus: ${ORIGIN}`);
  for (const [k, v] of Object.entries(report.totals)) console.log(`  ${k}: ${v}`);
  console.log("  masalah per jenis:", Object.fromEntries(byProblem));
  console.log(`Laporan: ${path.relative(process.cwd(), OUT_FILE)}`);
  if (process.argv.includes("--strict") && (issues.length || brokenLinks.length || brokenImages.length)) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
