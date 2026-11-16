import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllPages, getPage } from "@/lib/content";
import { metadataFromSeo } from "@/lib/seo";
import { STATIC_ROUTES } from "@/config/routes";
import { GenericPageTemplate } from "@/components/templates/GenericPageTemplate";

type Props = { params: Promise<{ slug: string; child: string }> };

/** Halaman anak yang belum punya route khusus (lihat STATIC_ROUTES). */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAllPages())
    .filter((p) => p.path.split("/").length === 2 && !STATIC_ROUTES.has(p.path))
    .map((p) => {
      const [slug, child] = p.path.split("/");
      return { slug, child };
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, child } = await params;
  const page = await getPage(`${slug}/${child}`);
  return page ? metadataFromSeo(page.seo, { title: page.title, path: `/${slug}/${child}/` }) : {};
}

export default async function ChildPage({ params }: Props) {
  const { slug, child } = await params;
  const page = await getPage(`${slug}/${child}`);
  if (!page) notFound();
  return <GenericPageTemplate page={page} />;
}
