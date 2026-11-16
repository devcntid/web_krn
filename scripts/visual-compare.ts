/**
 * Visual regression WordPress vs Next.js.
 *
 *   npm run visual:compare                       # semua URL × semua viewport
 *   npm run visual:compare -- --only=/kemitraan/ # satu URL (boleh diulang, dipisah koma)
 *   npm run visual:compare -- --widths=1440,390
 *
 * Untuk tiap URL di docs/visual-urls.txt dan tiap lebar viewport:
 *  1. ambil screenshot halaman penuh dari WordPress dan Next.js,
 *  2. hitung persentase piksel yang berbeda (pixelmatch),
 *  3. simpan gambar berdampingan  WordPress | Next.js | Diff  di qa/screenshots/,
 *  4. tulis tabel hasil ke docs/VISUAL_QA_REPORT.md (di antara penanda otomatis;
 *     teks di luar penanda — catatan manual — dipertahankan).
 *
 * Env: WP_ORIGIN (default https://relawannusantara.org), NEXT_ORIGIN (default
 * http://localhost:3000), VISUAL_BROWSER_CHANNEL (default "chrome" = Chrome terpasang;
 * kosongkan untuk Chromium bawaan Playwright: `npx playwright-core install chromium`).
 *
 * Catatan metode: gerakan dimatikan (prefers-reduced-motion + CSS), iframe pihak
 * ketiga disembunyikan, dan tinggi halaman dibatasi MAX_HEIGHT agar hasil stabil.
 * Bila tinggi kedua halaman berbeda, selisihnya dihitung sebagai piksel berbeda.
 */

import fs from "node:fs";
import path from "node:path";

import pixelmatch from "pixelmatch";
import { chromium, type Browser } from "playwright-core";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const URLS_FILE = path.join(ROOT, "docs", "visual-urls.txt");
const REPORT_FILE = path.join(ROOT, "docs", "VISUAL_QA_REPORT.md");
const OUT_DIR = path.join(ROOT, "qa", "screenshots");
const RESULTS_FILE = path.join(OUT_DIR, "results.json");

const WP_ORIGIN = (process.env.WP_ORIGIN ?? "https://relawannusantara.org").replace(/\/$/, "");
const NEXT_ORIGIN = (process.env.NEXT_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
const CHANNEL = process.env.VISUAL_BROWSER_CHANNEL ?? "chrome";

const ALL_WIDTHS = [1440, 1280, 768, 390, 360];
const MAX_HEIGHT = 8000;
const CONCURRENCY = 3;
const AUTO_START = "<!-- visual:auto:start -->";
const AUTO_END = "<!-- visual:auto:end -->";

const STABILIZE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; caret-color: transparent !important; }
  iframe, video { visibility: hidden !important; }
`;

type Shot = { png: PNG; status: number; fullHeight: number } | { error: string };
type Result = {
  url: string;
  width: number;
  /** Persen piksel berbeda; null bila salah satu sisi gagal dimuat. */
  diff: number | null;
  wpHeight: number | null;
  nextHeight: number | null;
  wpStatus: number | null;
  nextStatus: number | null;
  file: string | null;
  notes: string[];
};

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

function readUrls(): string[] {
  const only = arg("only")?.split(",").map((s) => s.trim());
  const urls = fs
    .readFileSync(URLS_FILE, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return only ? urls.filter((u) => only.includes(u)) : urls;
}

const slugOf = (url: string) =>
  url
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "beranda";

async function capture(browser: Browser, origin: string, url: string, width: number): Promise<Shot> {
  const mobile = width <= 480;
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
    locale: "id-ID",
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(origin + url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => undefined);
    await page.addStyleTag({ content: STABILIZE_CSS });
    // Gulir sampai bawah agar gambar lazy & animasi "muncul saat digulir" selesai.
    await page.evaluate(async (max) => {
      for (let y = 0; y < Math.min(document.documentElement.scrollHeight, max); y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
    }, MAX_HEIGHT);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    await page.waitForTimeout(800);
    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const buffer = await page.screenshot({
      fullPage: true,
      clip: { x: 0, y: 0, width, height: Math.min(fullHeight, MAX_HEIGHT) },
      animations: "disabled",
    });
    return { png: PNG.sync.read(buffer), status: response?.status() ?? 0, fullHeight };
  } catch (e) {
    return { error: e instanceof Error ? e.message.split("\n")[0].slice(0, 120) : String(e) };
  } finally {
    await context.close();
  }
}

/** Salin gambar ke kanvas W×H; area di luar gambar diisi warna penanda (dihitung sebagai beda). */
function pad(src: PNG, width: number, height: number, fill: [number, number, number]): PNG {
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = fill[0];
    out.data[i + 1] = fill[1];
    out.data[i + 2] = fill[2];
    out.data[i + 3] = 255;
  }
  PNG.bitblt(src, out, 0, 0, Math.min(src.width, width), Math.min(src.height, height), 0, 0);
  return out;
}

/** Gabungkan WordPress | Next.js | Diff menjadi satu JPEG (tiap panel diperkecil ke ≤480px). */
async function saveSideBySide(browser: Browser, panels: { label: string; png: PNG }[], file: string) {
  const panelWidth = Math.min(480, panels[0].png.width);
  const scale = panelWidth / panels[0].png.width;
  const height = Math.ceil(panels[0].png.height * scale) + 28;
  const html = `<body style="margin:0;display:flex;gap:8px;background:#222;font:600 13px/28px system-ui;color:#fff">${panels
    .map(
      (p) =>
        `<div style="width:${panelWidth}px"><div style="height:28px;padding-left:8px">${p.label}</div><img style="display:block;width:${panelWidth}px" src="data:image/png;base64,${PNG.sync.write(p.png).toString("base64")}"></div>`,
    )
    .join("")}</body>`;
  const context = await browser.newContext({ viewport: { width: panelWidth * panels.length + 8 * (panels.length - 1), height: Math.min(height, 900) } });
  const page = await context.newPage();
  await page.setContent(html);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 72 });
  await context.close();
}

async function compare(browser: Browser, url: string, width: number): Promise<Result> {
  const [wp, next] = await Promise.all([capture(browser, WP_ORIGIN, url, width), capture(browser, NEXT_ORIGIN, url, width)]);
  const result: Result = {
    url,
    width,
    diff: null,
    wpHeight: "error" in wp ? null : wp.fullHeight,
    nextHeight: "error" in next ? null : next.fullHeight,
    wpStatus: "error" in wp ? null : wp.status,
    nextStatus: "error" in next ? null : next.status,
    file: null,
    notes: [],
  };
  if ("error" in wp) result.notes.push(`WordPress gagal dimuat (${wp.error})`);
  if ("error" in next) result.notes.push(`Next.js gagal dimuat (${next.error})`);
  if ("error" in wp || "error" in next) return result;

  const height = Math.max(wp.png.height, next.png.height);
  const a = pad(wp.png, width, height, [255, 0, 255]);
  const b = pad(next.png, width, height, [0, 255, 255]);
  const diff = new PNG({ width, height });
  const changed = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.1, includeAA: false });
  result.diff = Math.round((changed / (width * height)) * 1000) / 10;

  if (wp.status !== next.status) result.notes.push(`status HTTP berbeda: WP ${wp.status}, Next ${next.status}`);
  const delta = next.fullHeight - wp.fullHeight;
  if (Math.abs(delta) > Math.max(40, wp.fullHeight * 0.03)) {
    result.notes.push(`tinggi Next ${delta > 0 ? "+" : ""}${Math.round((delta / wp.fullHeight) * 100)}% (${wp.fullHeight}→${next.fullHeight}px)`);
  }
  if (wp.fullHeight > MAX_HEIGHT || next.fullHeight > MAX_HEIGHT) result.notes.push(`dipotong di ${MAX_HEIGHT}px`);

  const file = path.join(OUT_DIR, `${slugOf(url)}-${width}.jpg`);
  await saveSideBySide(
    browser,
    [
      { label: `WordPress · ${width}px`, png: a },
      { label: `Next.js · ${width}px`, png: b },
      { label: `Diff · ${result.diff}%`, png: diff },
    ],
    file,
  );
  result.file = path.relative(ROOT, file);
  return result;
}

function writeReport(results: Result[]) {
  const urls = [...new Set(results.map((r) => r.url))];
  const widths = [...new Set(results.map((r) => r.width))].sort((x, y) => y - x);
  const cell = (r: Result | undefined) => (r ? (r.diff === null ? "gagal" : `${r.diff.toFixed(1)}%`) : "–");

  const lines: string[] = [];
  lines.push(`_Dijalankan ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · WordPress: ${WP_ORIGIN} · Next.js: ${NEXT_ORIGIN}_`, "");
  lines.push("### Ringkasan (persen piksel berbeda — makin kecil makin mirip)", "");
  lines.push(`| URL | ${widths.map((w) => `${w}px`).join(" | ")} |`, `|---|${widths.map(() => "---:").join("|")}|`);
  for (const url of urls) {
    lines.push(`| \`${url}\` | ${widths.map((w) => cell(results.find((r) => r.url === url && r.width === w))).join(" | ")} |`);
  }
  lines.push("", "### Rincian", "", "| URL | Viewport | Skor beda | Tinggi WP → Next | Catatan | Screenshot |", "|---|---:|---:|---|---|---|");
  for (const r of results) {
    const heights = r.wpHeight !== null && r.nextHeight !== null ? `${r.wpHeight} → ${r.nextHeight}px` : "–";
    lines.push(
      `| \`${r.url}\` | ${r.width} | ${cell(r)} | ${heights} | ${r.notes.join("; ") || "–"} | ${r.file ? `\`${r.file}\`` : "–"} |`,
    );
  }
  const auto = `${AUTO_START}\n${lines.join("\n")}\n${AUTO_END}`;

  let doc: string;
  if (fs.existsSync(REPORT_FILE) && fs.readFileSync(REPORT_FILE, "utf8").includes(AUTO_START)) {
    const old = fs.readFileSync(REPORT_FILE, "utf8");
    doc = old.slice(0, old.indexOf(AUTO_START)) + auto + old.slice(old.indexOf(AUTO_END) + AUTO_END.length);
  } else {
    doc = `# VISUAL_QA_REPORT\n\nPerbandingan visual WordPress vs Next.js (\`npm run visual:compare\`, daftar URL: \`docs/visual-urls.txt\`).\n\n## Hasil otomatis\n\n${auto}\n`;
  }
  fs.writeFileSync(REPORT_FILE, doc);
}

async function main() {
  const urls = readUrls();
  const widths = arg("widths")?.split(",").map(Number).filter(Boolean) ?? ALL_WIDTHS;
  if (!urls.length) throw new Error("Tidak ada URL untuk dibandingkan (cek docs/visual-urls.txt atau --only).");
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jobs = urls.flatMap((url) => widths.map((width) => ({ url, width })));
  const fresh: Result[] = [];
  const browser = await chromium.launch({ headless: true, ...(CHANNEL ? { channel: CHANNEL } : {}) });
  try {
    let next = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (next < jobs.length) {
          const job = jobs[next++];
          const r = await compare(browser, job.url, job.width);
          fresh.push(r);
          console.log(`${r.diff === null ? "gagal " : `${r.diff.toFixed(1).padStart(5)}%`}  ${String(r.width).padStart(4)}px  ${r.url}${r.notes.length ? `  — ${r.notes.join("; ")}` : ""}`);
        }
      }),
    );
  } finally {
    await browser.close();
  }

  // Jalankan sebagian (--only/--widths) memperbarui baris terkait saja; sisanya dari hasil sebelumnya.
  const previous: Result[] = fs.existsSync(RESULTS_FILE) ? (JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8")) as Result[]) : [];
  const key = (r: Result) => `${r.url}|${r.width}`;
  const merged = new Map(previous.map((r) => [key(r), r]));
  for (const r of fresh) merged.set(key(r), r);
  const order = fs.readFileSync(URLS_FILE, "utf8").split("\n").map((l) => l.trim());
  const all = [...merged.values()].sort((x, y) => order.indexOf(x.url) - order.indexOf(y.url) || y.width - x.width);

  fs.writeFileSync(RESULTS_FILE, `${JSON.stringify(all, null, 2)}\n`);
  writeReport(all);
  console.log(`\n${fresh.length} perbandingan selesai → ${path.relative(ROOT, REPORT_FILE)}, ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
