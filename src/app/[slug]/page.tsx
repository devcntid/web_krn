import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllPages, getAllPosts, getPage, getPost } from "@/lib/content";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { STATIC_ROUTES } from "@/config/routes";
import { PostTemplate } from "@/components/templates/PostTemplate";
import { GenericPageTemplate } from "@/components/templates/GenericPageTemplate";
import { JsonLd } from "@/components/seo/JsonLd";

type Props = { params: Promise<{ slug: string }> };

/**
 * Post (permalink /%postname%/) dan halaman level atas yang tidak punya
 * route khusus. Slug WordPress dipertahankan 1:1.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  const posts = getAllPosts().map((p) => ({ slug: p.slug }));
  const pages = getAllPages()
    .filter((p) => !p.path.includes("/") && !STATIC_ROUTES.has(p.path))
    .map((p) => ({ slug: p.path }));
  return [...posts, ...pages];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (post) return metadataFromSeo(post.seo, { title: post.title, path: `/${slug}/`, description: post.excerpt });
  const page = getPage(slug);
  if (page) return metadataFromSeo(page.seo, { title: page.title, path: `/${slug}/` });
  return {};
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;

  const post = getPost(slug);
  if (post) {
    return (
      <>
        <PostTemplate post={post} />
        <JsonLd data={post.seo.jsonLd ?? []} />
      </>
    );
  }

  const page = getPage(slug);
  if (page) {
    return (
      <>
        <GenericPageTemplate page={page} />
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: page.title, path: `/${slug}/` },
          ])}
        />
      </>
    );
  }

  notFound();
}
