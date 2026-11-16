/**
 * Pemeriksa konten hasil ekspor WordPress (folder content/).
 *
 *   npm run check:content            # tulis content/check-report.json + ringkasan
 *   npm run check:content -- --strict  # exit 1 bila ada temuan (untuk CI)
 *
 * Yang dilaporkan:
 *  - post tanpa featured image
 *  - gambar tanpa alt (featured image & <img> di HTML konten)
 *  - post/halaman dengan HTML kosong
 *  - link internal ke URL yang tidak ada di content/ (post, halaman, kategori, tag,
 *    route khusus, redirect) dan ke media yang tidak ada
 *  - gambar di konten yang file medianya tidak ada
 *
 * Path milik aplikasi donasi (/campaign, /donasi, /prog…) tidak dianggap rusak —
 * dilayani aplikasi terpisah — dan hanya dihitung.
 */

import fs from "node:fs";
import path from "node:path";

import * as cheerio from "cheerio";

import { legacyRedirects } from "../src/config/redirects";
import { isDonationAppPath } from "../src/config/routes";
import type { Page, PageSummary, Post, PostSummary, Term } from "../src/types/content";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const UPLOADS_DIR = path.join(ROOT, "public", "wp-content", "uploads");
const REPORT_FILE = path.join(CONTENT_DIR, "check-report.json");
const UPLOADS_PREFIX = "/wp-content/uploads/";
const SITE_HOSTS = new Set(["relawannusantara.org", "www.relawannusantara.org"]);
/** Route Next.js yang tidak berasal dari content/. */
const APP_ROUTES = ["/", "/artikel/", "/berita/", "/search/", "/sitemap.xml", "/robots.txt"];

type DocRef = { type: "post" | "page"; id: number; url: string; title: string };
type ImageIssue = DocRef & { where: "featured" | "content"; src: string };
type LinkIssue = DocRef & { href: string; target: string; kind: "page" | "media" };

function readJson<T>(rel: string, fallback: T): T {
  const file = path.join(CONTENT_DIR, rel);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

const safeName = (p: string) => p.replace(/\//g, "__");

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Pola `source` redirect Next.js (path-to-regexp sederhana) → RegExp. */
function redirectToRegExp(source: string): RegExp {
  const pattern = source
    .replace(/:[A-Za-z_]+\(([^)]*)\)/g, "($1)")
    .replace(/:[A-Za-z_]+/g, "[^/]+")
    .replace(/\./g, "\\.");
  return new RegExp(`^${pattern}$`);
}

/* ---------- Indeks URL yang valid ---------- */

// Sama seperti src/lib/content.ts: post/halaman di path aplikasi donasi tidak dirender situs ini.
const allPosts = readJson<PostSummary[]>("posts/index.json", []);
const allPages = readJson<PageSummary[]>("pages/index.json", []);
const posts = allPosts.filter((p) => !isDonationAppPath(p.slug));
const pages = allPages.filter((p) => !isDonationAppPath(p.path));
const skippedDonationAppDocuments = allPosts.length + allPages.length - posts.length - pages.length;
const categories = readJson<Term[]>("categories.json", []);
const tags = readJson<Term[]>("tags.json", []);
const manifest = new Set(readJson<string[]>("media-manifest.json", []));
const hasLocalUploads = fs.existsSync(UPLOADS_DIR);

const validPaths = new Set<string>(APP_ROUTES);
for (const p of posts) validPaths.add(`/${p.slug}/`);
for (const p of pages) validPaths.add(`/${p.path}/`);
for (const c of categories) validPaths.add(`/category/${c.path}/`);
for (const t of tags) validPaths.add(`/tag/${t.slug}/`);
const redirectPatterns = legacyRedirects.map((r) => redirectToRegExp(r.source));

function mediaExists(pathname: string): boolean {
  if (hasLocalUploads) return fs.existsSync(path.join(ROOT, "public", pathname));
  return manifest.has(pathname);
}

type Resolved =
  | { kind: "skip" }
  | { kind: "donation" }
  | { kind: "media"; pathname: string; ok: boolean }
  | { kind: "page"; pathname: string; ok: boolean };

/** Klasifikasikan href/src: eksternal & anchor dilewati; internal dicek keberadaannya. */
function resolveInternal(raw: string): Resolved {
  const href = raw.trim();
  if (!href || href.startsWith("#") || /^(mailto|tel|sms|javascript|data|whatsapp):/i.test(href)) return { kind: "skip" };

  let url: URL;
  try {
    url = new URL(href, "https://relawannusantara.org/");
  } catch {
    return { kind: "skip" };
  }
  if (!/^https?:$/.test(url.protocol) || !SITE_HOSTS.has(url.hostname)) return { kind: "skip" };

  const pathname = safeDecode(url.pathname).replace(/\/{2,}/g, "/");
  if (pathname.startsWith(UPLOADS_PREFIX)) return { kind: "media", pathname, ok: mediaExists(pathname) };
  if (isDonationAppPath(pathname)) return { kind: "donation" };

  const hasExtension = /\.[a-z0-9]{2,5}$/i.test(pathname);
  const normalized = hasExtension || pathname.endsWith("/") ? pathname : `${pathname}/`;
  const ok =
    validPaths.has(normalized) ||
    // Arsip berpaginasi: /category/<path>/page/<n>/, /tag/<slug>/page/<n>/
    validPaths.has(normalized.replace(/page\/\d+\/$/, "")) ||
    redirectPatterns.some((re) => re.test(normalized));
  return { kind: "page", pathname: normalized, ok };
}

/* ---------- Pemeriksaan ---------- */

const postsWithoutFeaturedImage: DocRef[] = [];
const imagesWithoutAlt: ImageIssue[] = [];
const emptyHtml: DocRef[] = [];
const missingFiles: DocRef[] = [];
const brokenInternalLinks: LinkIssue[] = [];
const missingImages: ImageIssue[] = [];
let donationAppLinks = 0;
let checkedLinks = 0;
let checkedImages = 0;

function checkHtml(doc: DocRef, html: string) {
  const $ = cheerio.load(html);

  const hasMedia = $("img, iframe, video, audio").length > 0;
  if (!$.root().text().trim() && !hasMedia) emptyHtml.push(doc);

  $("img").each((_, el) => {
    checkedImages += 1;
    const src = $(el).attr("src") ?? "";
    if (!($(el).attr("alt") ?? "").trim()) imagesWithoutAlt.push({ ...doc, where: "content", src });
    const res = resolveInternal(src);
    if (res.kind === "media" && !res.ok) missingImages.push({ ...doc, where: "content", src });
  });

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const res = resolveInternal(href);
    if (res.kind === "skip") return;
    checkedLinks += 1;
    if (res.kind === "donation") donationAppLinks += 1;
    else if (!res.ok) brokenInternalLinks.push({ ...doc, href: href.slice(0, 300), target: res.pathname.slice(0, 300), kind: res.kind });
  });
}

for (const summary of posts) {
  const doc: DocRef = { type: "post", id: summary.id, url: `/${summary.slug}/`, title: summary.title };

  if (!summary.featuredImage) {
    postsWithoutFeaturedImage.push(doc);
  } else {
    checkedImages += 1;
    const { src, alt } = summary.featuredImage;
    if (!alt.trim()) imagesWithoutAlt.push({ ...doc, where: "featured", src });
    const res = resolveInternal(src);
    if (res.kind === "media" && !res.ok) missingImages.push({ ...doc, where: "featured", src });
  }

  const post = readJson<Post | null>(`posts/${safeName(summary.slug)}.json`, null);
  if (!post) missingFiles.push(doc);
  else checkHtml(doc, post.html);
}

for (const summary of pages) {
  const doc: DocRef = { type: "page", id: summary.id, url: `/${summary.path}/`, title: summary.title };
  const page = readJson<Page | null>(`pages/${safeName(summary.path)}.json`, null);
  if (!page) missingFiles.push(doc);
  else checkHtml(doc, page.html);
}

/* ---------- Laporan ---------- */

const countDocs = (items: DocRef[]) => new Set(items.map((i) => `${i.type}:${i.id}`)).size;

const report = {
  generatedAt: new Date().toISOString(),
  mediaSource: hasLocalUploads ? "public/wp-content/uploads" : "content/media-manifest.json",
  totals: {
    posts: posts.length,
    pages: pages.length,
    checkedImages,
    checkedInternalLinks: checkedLinks,
    donationAppLinks,
    skippedDonationAppDocuments,
  },
  summary: {
    postsWithoutFeaturedImage: postsWithoutFeaturedImage.length,
    imagesWithoutAlt: imagesWithoutAlt.length,
    documentsWithImagesWithoutAlt: countDocs(imagesWithoutAlt),
    emptyHtml: emptyHtml.length,
    missingContentFiles: missingFiles.length,
    brokenInternalLinks: brokenInternalLinks.length,
    documentsWithBrokenInternalLinks: countDocs(brokenInternalLinks),
    missingImages: missingImages.length,
  },
  postsWithoutFeaturedImage,
  emptyHtml,
  missingContentFiles: missingFiles,
  brokenInternalLinks,
  missingImages,
  imagesWithoutAlt,
};

fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Konten diperiksa: ${posts.length} post, ${pages.length} halaman (${skippedDonationAppDocuments} di path aplikasi donasi dilewati)`);
console.log(`  ${checkedImages} gambar · ${checkedLinks} link internal (${donationAppLinks} ke aplikasi donasi, dilewati)`);
for (const [key, value] of Object.entries(report.summary)) console.log(`  ${value === 0 ? "✓" : "✗"} ${key}: ${value}`);
console.log(`Laporan: ${path.relative(ROOT, REPORT_FILE)}`);

const findings =
  postsWithoutFeaturedImage.length +
  imagesWithoutAlt.length +
  emptyHtml.length +
  missingFiles.length +
  brokenInternalLinks.length +
  missingImages.length;
if (process.argv.includes("--strict") && findings > 0) process.exitCode = 1;
