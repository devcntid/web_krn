import { timingSafeEqual } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { CACHE_TAGS } from "@/lib/content";
import { publishDuePosts } from "@/server/cron-publish";

export const dynamic = "force-dynamic";

/** Vercel Cron mengirim `Authorization: Bearer <CRON_SECRET>`. Tanpa CRON_SECRET route ini menolak semua. */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** GET /api/cron/publish — terbitkan post Terjadwal yang sudah waktunya, lalu segarkan cache publik. */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const published = await publishDuePosts();
  if (published.length) {
    // { expire: 0 }: pengunjung berikutnya langsung mendapat versi baru (bukan stale-while-revalidate).
    for (const p of published) revalidateTag(CACHE_TAGS.post(p.slug), { expire: 0 });
    revalidateTag(CACHE_TAGS.posts, { expire: 0 });
    revalidateTag(CACHE_TAGS.taxonomy, { expire: 0 });
    revalidatePath("/sitemap.xml");
  }
  return NextResponse.json({ published: published.map((p) => p.slug) }, { headers: { "cache-control": "no-store" } });
}
