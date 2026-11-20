import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import type { Metadata } from "next";

import { getRelatedCategories, paginate, searchPosts } from "@/lib/content";
import { parsePageParam } from "@/lib/page-param";
import { ArchiveTemplate } from "@/components/templates/ArchiveTemplate";
import { initLocale } from "@/i18n/request";

type LangProps = { params: Promise<{ lang: string }> };

type Props = { searchParams: Promise<{ s?: string; hal?: string }> };

/** Hasil pencarian. URL publik tetap "/?s=…" (di-rewrite oleh src/proxy.ts). */
export async function generateMetadata({ params, searchParams }: Props & LangProps): Promise<Metadata> {
  await initLocale(params);
  const { s = "" } = await searchParams;
  return {
    title: s ? `Hasil pencarian: ${s}` : "Pencarian",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: Props & LangProps) {
  await initLocale(params);
  const { s = "", hal = "1" } = await searchParams;
  const query = s.trim();
  const dict = getDictionary(getLocale());
  const t = dict.archive;
  const matches = await searchPosts(query);
  const result = paginate(matches, parsePageParam(hal), 9);

  return (
    <ArchiveTemplate
      eyebrow={t.searchEyebrow}
      title={query ? t.resultsFor(query) : t.searchEyebrow}
      description={query ? t.found(result.total) : t.enterKeyword}
      breadcrumb={[{ name: dict.common.home, href: "/" }, { name: t.searchEyebrow }]}
      query={query}
      relatedCategories={(await getRelatedCategories(matches))}
      emptyMessage={query ? t.noMatch : ""}
      posts={result.items}
      page={result.page}
      totalPages={result.totalPages}
      hrefFor={(n) => `/?s=${encodeURIComponent(query)}${n > 1 ? `&hal=${n}` : ""}`}
    />
  );
}
