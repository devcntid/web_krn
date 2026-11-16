import { NextResponse } from "next/server";

import { auth } from "@/server/auth";

/**
 * Lindungi /admin/** kecuali /admin/login. `auth()` menjalankan callback `jwt` yang membaca
 * ulang peran & status nonaktif dari database. Halaman/aksi tetap wajib memanggil
 * requireUser()/requireAbility() — proxy hanya lapisan pertama.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return NextResponse.next();
  if (req.auth?.user?.mfaPassed) return NextResponse.next();
  const login = new URL("/admin/login/", req.nextUrl.origin);
  login.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(login);
});

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
