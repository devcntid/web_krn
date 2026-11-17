import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TaxonomyManager } from "@/components/admin/taksonomi/TaxonomyManager";
import { can, requireUser } from "@/server/permissions";
import { PROTECTED_CATEGORY_SLUGS, TAG_PAGE_SIZE, listCategoryRows, listTagRows, taxonomyTotals } from "@/server/taxonomy-service";

export const metadata: Metadata = { title: "Kategori & Tag" };

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** /admin/taksonomi (artboard "A7 · Kategori & Tag"). Butuh kemampuan "Meninjau & menyetujui". */
export default async function TaksonomiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  if (!can(user, "content.review")) redirect("/admin/");
  const sp = await searchParams;
  const kind = one(sp.jenis) === "tag" ? "tag" : "category";
  const q = one(sp.q).slice(0, 80);
  const sort = one(sp.urut) === "name" ? "name" : "count";
  const pageParam = Number.parseInt(one(sp.page) || "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [categories, totals, tagList] = await Promise.all([listCategoryRows(), taxonomyTotals(), kind === "tag" ? listTagRows(q, page, sort) : null]);

  return (
    <TaxonomyManager
      kind={kind}
      rows={kind === "tag" ? (tagList?.rows ?? []) : categories}
      categories={categories}
      totals={totals}
      protectedSlugs={[...PROTECTED_CATEGORY_SLUGS]}
      tagQuery={{ q, sort, page, pages: Math.max(1, Math.ceil((tagList?.total ?? 0) / TAG_PAGE_SIZE)), total: tagList?.total ?? 0 }}
    />
  );
}
