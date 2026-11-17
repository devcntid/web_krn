import { get } from "@vercel/edge-config";
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";

import { normalizeRedirectPath } from "@/lib/redirect-rules";
import { auth } from "@/server/auth";

/**
 * 1) /admin/** (kecuali /admin/login): wajib masuk penuh (termasuk 2FA). `auth()` menjalankan
 *    callback `jwt` yang membaca ulang peran & status nonaktif dari database. Halaman/aksi tetap
 *    wajib memanggil requireUser()/requireAbility() — proxy hanya lapisan pertama.
 * 2) Halaman situs: redirect dinamis dari Vercel Edge Config (dikelola di /admin/seo, disinkronkan
 *    oleh src/server/redirects-sync.ts). Redirect statis tetap di next.config (src/config/redirects.ts).
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

/** Peta redirect dari Edge Config, disimpan 30 detik di memori instance. Kosong bila belum dikonfigurasi. */
async function redirectMap(): Promise<RedirectMap> {
  if (!process.env.EDGE_CONFIG) return {};
  if (cached && Date.now() - cached.at < 30_000) return cached.map;
  try {
    const map = ((await get<RedirectMap>("redirects")) ?? {}) as RedirectMap;
    cached = { at: Date.now(), map };
    return map;
  } catch {
    return cached?.map ?? {};
  }
}

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return (adminProxy as unknown as (r: NextRequest, e: NextFetchEvent) => Promise<Response>)(req, event);
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
