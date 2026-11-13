import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategories, getCategoryByPath, getPostsByCategory, paginate } from "@/lib/content";
import { pageTitle } from "@/lib/seo";
import { ArchiveTemplate } from "@/components/templates/ArchiveTemplate";

type Props = { params: Promise<{ path: string[] }> };

const PER_PAGE = 9;

/**
 * Arsip kategori WordPress: /category/<slug>/, /category/<parent>/<child>/,
 * dan pagination /category/<slug>/page/<n>/.
 */
function parse(segments: string[]) {
  const n = segments.length;
  if (n >= 3 && segments[n - 2] === "page" && /^\d+$/.test(segments[n - 1])) {
    return { termPath: segments.slice(0, -2).join("/"), page: Number(segments[n - 1]) };
  }
  return { termPath: segments.join("/"), page: 1 };
}

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return getCategories()
    .filter((c) => c.count > 0)
    .flatMap((c) => {
      const pages = Math.ceil(getPostsByCategory(c.slug).length / PER_PAGE);
      const base = c.path.split("/");
      return [
        { path: base },
        ...Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ path: [...base, "page", String(i + 2)] })),
      ];
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { termPath, page } = parse((await params).path);
  const term = getCategoryByPath(termPath);
  if (!term) return {};
  const suffix = page > 1 ? ` - Halaman ${page}` : "";
  return {
    title: { absolute: pageTitle(`${term.name}${suffix}`) },
    description: term.description || `Kumpulan publikasi Relawan Nusantara dalam kategori ${term.name}.`,
    alternates: { canonical: `/category/${term.path}/${page > 1 ? `page/${page}/` : ""}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { termPath, page } = parse((await params).path);
  const term = getCategoryByPath(termPath);
  if (!term) notFound();

  const result = paginate(getPostsByCategory(term.slug), page, PER_PAGE);
  if (page > result.totalPages) notFound();

  return (
    <ArchiveTemplate
      eyebrow="Kategori"
      title={term.name}
      description={term.description}
      posts={result.items}
      page={result.page}
      totalPages={result.totalPages}
      hrefFor={(n) => `/category/${term.path}/${n > 1 ? `page/${n}/` : ""}`}
    />
  );
}
