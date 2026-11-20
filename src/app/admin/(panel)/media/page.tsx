import type { Metadata } from "next";

import { MediaLibrary } from "@/components/admin/media/MediaLibrary";
import { can, requireUser } from "@/server/permissions";
import { parsePageParam } from "@/lib/page-param";
import { MEDIA_PAGE_SIZE, listMedia, mediaOverview } from "@/server/repos/admin-media";

export const metadata: Metadata = { title: "Pustaka Media" };

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * /admin/media (artboard "A6 · Pustaka Media"). Semua peran yang masuk boleh melihat & menyalin URL;
 * unggah, ubah alt, dan hapus butuh kemampuan `media.manage` (Super Admin, Editor, Penulis).
 */
export default async function MediaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const jenis = one(sp.jenis);
  const kind = jenis === "image" || jenis === "pdf" || jenis === "video" ? jenis : "";
  const folder = /^\d{4}\/\d{2}$/.test(one(sp.folder)) ? one(sp.folder) : "";
  const pageParam = parsePageParam(one(sp.page));
  const filters = { q: one(sp.q).slice(0, 120), jenis: kind, folder, alt: one(sp.alt) === "kosong" };

  const [overview, first] = await Promise.all([
    mediaOverview(),
    listMedia({ q: filters.q, kind, folder, noAlt: filters.alt, page: pageParam }),
  ]);
  const pages = Math.max(1, Math.ceil(first.total / MEDIA_PAGE_SIZE));
  const page = Math.min(pageParam, pages);

  return <MediaLibrary items={first.items} total={first.total} page={page} pages={pages} filters={filters} overview={overview} canManage={can(user, "media.manage")} />;
}
