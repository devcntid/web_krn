import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PreviewBanner } from "@/components/content/PreviewBanner";
import { SectionPage, loadPage, sectionPageMetadata } from "@/components/site/sections/SectionPage";
import { GenericPageTemplate } from "@/components/templates/GenericPageTemplate";
import { STATIC_ROUTES } from "@/config/routes";
import { initLocale } from "@/i18n/request";
import { getAllPages } from "@/lib/content";
import { metadataFromSeo } from "@/lib/seo";
import { isSectionTemplate } from "@/server/sections";

type Props = { params: Promise<{ slug: string; child: string }> };

/**
 * Halaman anak yang belum punya route khusus (lihat STATIC_ROUTES).
 * `dynamicParams = true`: halaman anak yang dibuat di admin setelah build dirender saat pertama
 * diminta; path yang tidak ada → 404.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getAllPages())
    .filter((p) => p.path.split("/").length === 2 && !STATIC_ROUTES.has(p.path))
    .map((p) => {
      const [slug, child] = p.path.split("/");
      return { slug, child };
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await initLocale(params);
  const { slug, child } = await params;
  const path = `${slug}/${child}`;
  const { page, preview } = await loadPage(path);
  if (!page) return {};
  if (preview || isSectionTemplate(page.template)) return sectionPageMetadata(path);
  return metadataFromSeo(page.seo, { title: page.title, path: `/${path}/` });
}

export default async function ChildPage({ params }: Props) {
  await initLocale(params);
  const { slug, child } = await params;
  const path = `${slug}/${child}`;
  const { page, preview } = await loadPage(path);
  if (!page) notFound();
  if (isSectionTemplate(page.template)) return <SectionPage path={path} />;
  return (
    <>
      <GenericPageTemplate page={page} />
      {preview ? <PreviewBanner /> : null}
    </>
  );
}
