import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategories, getCategoryByPath, getPostsByCategory, getRelatedCategories, paginate } from "@/lib/content";
import { breadcrumbJsonLd, pageTitle } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
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

export async function generateStaticParams() {
  // `count` = jumlah post terbit dalam kategori (dihitung di query), sama dengan panjang getPostsByCategory.
  return (await getCategories())
    .filter((c) => c.count > 0)
    .flatMap((c) => {
      const pages = Math.ceil(c.count / PER_PAGE);
      const base = c.path.split("/");
      return [
        { path: base },
        ...Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ path: [...base, "page", String(i + 2)] })),
      ];
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { termPath, page } = parse((await params).path);
  const term = await getCategoryByPath(termPath);
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
  const term = await getCategoryByPath(termPath);
  if (!term) notFound();

  const all = await getPostsByCategory(term.slug);
  const result = paginate(all, page, PER_PAGE);
  if (page > result.totalPages) notFound();

  // Kategori anak (mis. hewan-lingkungan/air-bersih) menampilkan induknya di breadcrumb.
  const parentPath = term.path.split("/").slice(0, -1).join("/");
  const parent = parentPath ? (await getCategoryByPath(parentPath)) : undefined;
  const crumbs = [
    { name: "Beranda", href: "/" },
    ...(parent ? [{ name: parent.name, href: `/category/${parent.path}/` }] : []),
    { name: term.name, href: `/category/${term.path}/` },
  ];

  return (
    <>
      <ArchiveTemplate
        eyebrow="Kategori"
        title={term.name}
        description={term.description || `${result.total} publikasi dalam kategori ini.`}
        breadcrumb={crumbs.map((c, i) => (i === crumbs.length - 1 ? { name: c.name } : c))}
        relatedCategories={(await getRelatedCategories(all, [term.slug]))}
        posts={result.items}
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(n) => `/category/${term.path}/${n > 1 ? `page/${n}/` : ""}`}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.name, path: c.href })))} />
    </>
  );
}
