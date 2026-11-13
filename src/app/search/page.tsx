import type { Metadata } from "next";

import { paginate, searchPosts } from "@/lib/content";
import { ArchiveTemplate } from "@/components/templates/ArchiveTemplate";

type Props = { searchParams: Promise<{ s?: string; hal?: string }> };

/** Hasil pencarian. URL publik tetap "/?s=…" (di-rewrite oleh src/proxy.ts). */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { s = "" } = await searchParams;
  return {
    title: s ? `Hasil pencarian: ${s}` : "Pencarian",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { s = "", hal = "1" } = await searchParams;
  const query = s.trim();
  const result = paginate(searchPosts(query), Number(hal) || 1, 9);

  return (
    <ArchiveTemplate
      eyebrow="Pencarian"
      title={query ? `Hasil untuk “${query}”` : "Pencarian"}
      description={query ? `${result.total} publikasi ditemukan.` : "Masukkan kata kunci untuk mencari publikasi."}
      posts={result.items}
      page={result.page}
      totalPages={result.totalPages}
      hrefFor={(n) => `/?s=${encodeURIComponent(query)}${n > 1 ? `&hal=${n}` : ""}`}
    />
  );
}
