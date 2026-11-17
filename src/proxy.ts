import { get } from "@vercel/edge-config";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { normalizeRedirectPath } from "@/lib/redirect-rules";
import { auth } from "@/server/auth";
import { getDb, schema } from "@/server/db";
import { buildRedirectMap } from "@/server/redirects-sync";

/**
 * 1) /admin/** (kecuali /admin/login): wajib masuk penuh (termasuk 2FA). `auth()` menjalankan
 *    callback `jwt` yang membaca ulang peran & status nonaktif dari database. Halaman/aksi tetap
 *    wajib memanggil requireUser()/requireAbility() — proxy hanya lapisan pertama.
 * 2) Mode perawatan (/admin/pengaturan): pengunjung mendapat 503; admin yang punya cookie sesi
 *    tetap melihat situs (cukup cek keberadaan cookie — yang dilindungi hanyalah tampilan publik).
 * 3) Halaman situs: redirect dinamis (dikelola di /admin/seo) dari Vercel Edge Config, atau langsung
 *    dari tabel `redirects` bila Edge Config belum dikonfigurasi. Redirect statis tetap di next.config (src/config/redirects.ts).
 */
const adminProxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return NextResponse.next();
  if (req.auth?.user?.mfaPassed) return NextResponse.next();
  const login = new URL("/admin/login/", req.nextUrl.origin);
  login.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(login);
});

type RedirectMap = Record<string, [string, number]>;
let cached: { at: number; map: RedirectMap } | null = null;

/** Lama cache peta redirect di memori instance (ms). Bisa diperkecil lewat env untuk e2e. */
const REDIRECT_TTL = Number(process.env.REDIRECTS_CACHE_MS ?? 30_000);

/**
 * Peta redirect dinamis, disimpan REDIRECT_TTL di memori instance. Sumber: Vercel Edge Config bila
 * dikonfigurasi; bila tidak, langsung dari tabel `redirects` (satu query per instance per TTL).
 */
async function redirectMap(): Promise<RedirectMap> {
  if (cached && Date.now() - cached.at < REDIRECT_TTL) return cached.map;
  try {
    const map = process.env.EDGE_CONFIG ? (((await get<RedirectMap>("redirects")) ?? {}) as RedirectMap) : await buildRedirectMap();
    cached = { at: Date.now(), map };
    return map;
  } catch {
    return cached?.map ?? {};
  }
}

let maintenanceCache: { at: number; on: boolean } | null = null;

/** Status mode perawatan dari settings.integrations, disimpan 30 detik di memori instance. */
async function maintenanceOn(): Promise<boolean> {
  if (maintenanceCache && Date.now() - maintenanceCache.at < 30_000) return maintenanceCache.on;
  try {
    const [row] = await getDb().select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, "integrations")).limit(1);
    const on = (row?.value as { maintenance?: unknown } | undefined)?.maintenance === true;
    maintenanceCache = { at: Date.now(), on };
    return on;
  } catch {
    return maintenanceCache?.on ?? false;
  }
}

const MAINTENANCE_HTML = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Sedang dalam perawatan - Relawan Nusantara</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#fff;color:#1f1e17;padding:16px;box-sizing:border-box;text-align:center}h1{color:#006659;font-size:28px;margin:0 0 12px}p{margin:0;line-height:1.6;color:#4a4a4a}</style></head><body><main><h1>Sedang dalam perawatan</h1><p>Situs Relawan Nusantara sedang diperbarui. Silakan kembali beberapa saat lagi.</p><p lang="en" style="margin-top:8px">We are performing maintenance. Please check back soon.</p></main></body></html>`;

const hasSessionCookie = (req: NextRequest) => req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return (adminProxy as unknown as (r: NextRequest, e: NextFetchEvent) => Promise<Response>)(req, event);
  }

  if (!hasSessionCookie(req) && (await maintenanceOn())) {
    return new NextResponse(MAINTENANCE_HTML, { status: 503, headers: { "content-type": "text/html; charset=utf-8", "retry-after": "1800", "cache-control": "no-store" } });
  }

  const map = await redirectMap();
  if (!Object.keys(map).length) return NextResponse.next();
  const english = pathname === "/en" || pathname.startsWith("/en/");
  const path = normalizeRedirectPath(english ? pathname.slice(3) || "/" : pathname);
  const hit = map[path];
  if (!hit) return NextResponse.next();
  const [destination, status] = hit;
  if (status === 410) return new NextResponse("Halaman ini sudah dihapus.", { status: 410, headers: { "content-type": "text/plain; charset=utf-8" } });
  // Tujuan internal di versi Inggris tetap di /en/.
  const target = destination.startsWith("/") && english && !/^\/(campaign|donasi|prog)/.test(destination) ? `/en${destination}` : destination;
  return NextResponse.redirect(new URL(target, req.nextUrl.origin), status === 302 ? 302 : 301);
}

export const config = {
  // Semua halaman kecuali aset & API (redirect dinamis), plus /admin (auth).
  matcher: ["/((?!_next/|api/|wp-content/|favicon|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|txt|xml|pdf|woff2?)$).*)"],
};
