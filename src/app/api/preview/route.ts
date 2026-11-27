import { eq } from "drizzle-orm";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { getDb, schema } from "@/server/db";
import { can, getCurrentUser } from "@/server/permissions";

/**
 * Pratinjau draf: /api/preview/?id=<id post>, ?page=<id halaman>, atau ?home=1 (beranda).
 * Wajib masuk + ability sesuai jenis konten (bukan sekadar sesi admin).
 * Mengaktifkan Draft Mode (cookie __prerender_bypass) lalu mengalihkan ke permalink;
 * tujuan redirect diambil dari database, bukan dari query, agar tidak menjadi open redirect.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getCurrentUser();
  if (!user) redirect(`/admin/login/?callbackUrl=${encodeURIComponent(url.pathname + url.search)}`);

  // Pratinjau beranda: salinan kerja dari /admin/beranda (settings["home.draft"]).
  if (url.searchParams.has("home")) {
    if (!can(user, "pages.manage")) return new Response("Akses ditolak.", { status: 403 });
    (await draftMode()).enable();
    redirect("/");
  }

  const pageId = Number.parseInt(url.searchParams.get("page") ?? "", 10);
  if (Number.isInteger(pageId)) {
    if (!can(user, "pages.manage")) return new Response("Akses ditolak.", { status: 403 });
    const [page] = await getDb().select({ path: schema.pages.path, status: schema.pages.status }).from(schema.pages).where(eq(schema.pages.id, pageId)).limit(1);
    if (!page || page.status === "trashed") return new Response("Halaman tidak ditemukan.", { status: 404 });
    (await draftMode()).enable();
    redirect(page.path === "new-beranda" ? "/" : `/${page.path}/`);
  }

  if (!can(user, "draft.write")) return new Response("Akses ditolak.", { status: 403 });

  const id = Number.parseInt(url.searchParams.get("id") ?? "", 10);
  const [post] = Number.isInteger(id)
    ? await getDb()
        .select({ slug: schema.posts.slug, status: schema.posts.status, authorId: schema.posts.authorId })
        .from(schema.posts)
        .where(eq(schema.posts.id, id))
        .limit(1)
    : [];
  if (!post || post.status === "trashed") return new Response("Publikasi tidak ditemukan.", { status: 404 });

  // Draf/review/terjadwal: penulis sendiri, atau peran yang meninjau/menerbitkan.
  if (post.status !== "published") {
    const own = post.authorId === user.id;
    if (!own && !can(user, "content.review") && !can(user, "content.publish")) {
      return new Response("Akses ditolak.", { status: 403 });
    }
  }

  (await draftMode()).enable();
  redirect(`/${post.slug}/`);
}
