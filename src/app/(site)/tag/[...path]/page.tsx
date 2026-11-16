import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPostsByTag, getRelatedCategories, getTag, paginate } from "@/lib/content";
import { pageTitle } from "@/lib/seo";
import { ArchiveTemplate } from "@/components/templates/ArchiveTemplate";

type Props = { params: Promise<{ path: string[] }> };

const PER_PAGE = 9;

/**
 * Arsip tag /tag/<slug>/ (+ /page/<n>/). 1.857 tag tidak di-prerender saat
 * build; dirender saat pertama diakses lalu di-cache (ISR).
 */
export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [];
}

function parse(segments: string[]) {
  if (segments.length === 3 && segments[1] === "page" && /^\d+$/.test(segments[2])) {
    return { slug: segments[0], page: Number(segments[2]) };
  }
  return segments.length === 1 ? { slug: segments[0], page: 1 } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parse((await params).path);
  const tag = parsed && (await getTag(parsed.slug));
  if (!parsed || !tag) return {};
  return {
    title: { absolute: pageTitle(tag.name) },
    // Mengikuti WordPress: arsip tag tidak masuk sitemap.
    robots: { index: false, follow: true },
    alternates: { canonical: `/tag/${tag.slug}/` },
  };
}

export default async function TagPage({ params }: Props) {
  const parsed = parse((await params).path);
  const tag = parsed && (await getTag(parsed.slug));
  if (!parsed || !tag) notFound();

  const all = await getPostsByTag(tag.slug);
  const result = paginate(all, parsed.page, PER_PAGE);
  if (parsed.page > result.totalPages) notFound();

  return (
    <ArchiveTemplate
      eyebrow="Tag"
      title={tag.name}
      description={`${result.total} publikasi dengan tag ini.`}
      breadcrumb={[{ name: "Beranda", href: "/" }, { name: tag.name }]}
      relatedCategories={(await getRelatedCategories(all))}
      posts={result.items}
      page={result.page}
      totalPages={result.totalPages}
      hrefFor={(n) => `/tag/${tag.slug}/${n > 1 ? `page/${n}/` : ""}`}
    />
  );
}
