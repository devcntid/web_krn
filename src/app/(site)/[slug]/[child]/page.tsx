import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllPages, getPage } from "@/lib/content";
import { metadataFromSeo } from "@/lib/seo";
import { GenericPageTemplate } from "@/components/templates/GenericPageTemplate";

type Props = { params: Promise<{ slug: string; child: string }> };

/** Halaman anak, mis. /pr0gram-kami/kerelawanan/. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPages()
    .filter((p) => p.path.split("/").length === 2)
    .map((p) => {
      const [slug, child] = p.path.split("/");
      return { slug, child };
    });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, child } = await params;
  const page = getPage(`${slug}/${child}`);
  return page ? metadataFromSeo(page.seo, { title: page.title, path: `/${slug}/${child}/` }) : {};
}

export default async function ChildPage({ params }: Props) {
  const { slug, child } = await params;
  const page = getPage(`${slug}/${child}`);
  if (!page) notFound();
  return <GenericPageTemplate page={page} />;
}
