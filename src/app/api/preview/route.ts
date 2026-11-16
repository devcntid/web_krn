import { eq } from "drizzle-orm";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { getDb, schema } from "@/server/db";
import { getCurrentUser } from "@/server/permissions";

/**
 * Pratinjau draf: /api/preview/?id=<id post> atau /api/preview/?page=<id halaman>.
 * Hanya untuk pengguna admin yang sudah masuk.
 * Mengaktifkan Draft Mode (cookie __prerender_bypass) lalu mengalihkan ke permalink post;
 * tujuan redirect diambil dari database, bukan dari query, agar tidak menjadi open redirect.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getCurrentUser();
  if (!user) redirect(`/admin/login/?callbackUrl=${encodeURIComponent(url.pathname + url.search)}`);

  const pageId = Number.parseInt(url.searchParams.get("page") ?? "", 10);
  if (Number.isInteger(pageId)) {
    const [page] = await getDb().select({ path: schema.pages.path, status: schema.pages.status }).from(schema.pages).where(eq(schema.pages.id, pageId)).limit(1);
    if (!page || page.status === "trashed") return new Response("Halaman tidak ditemukan.", { status: 404 });
    (await draftMode()).enable();
    redirect(page.path === "new-beranda" ? "/" : `/${page.path}/`);
  }

  const id = Number.parseInt(url.searchParams.get("id") ?? "", 10);
  const [post] = Number.isInteger(id)
    ? await getDb().select({ slug: schema.posts.slug, status: schema.posts.status }).from(schema.posts).where(eq(schema.posts.id, id)).limit(1)
    : [];
  if (!post || post.status === "trashed") return new Response("Publikasi tidak ditemukan.", { status: 404 });

  (await draftMode()).enable();
  redirect(`/${post.slug}/`);
}
