import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAllPages, getAllPosts, getPage, getPost } from "@/lib/content";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { STATIC_ROUTES } from "@/config/routes";
import { PostTemplate } from "@/components/templates/PostTemplate";
import { GenericPageTemplate } from "@/components/templates/GenericPageTemplate";
import { JsonLd } from "@/components/seo/JsonLd";
import { initLocale } from "@/i18n/request";

type Props = { params: Promise<{ slug: string }> };

/**
 * Post (permalink /%postname%/) dan halaman level atas yang tidak punya
 * route khusus. Slug WordPress dipertahankan 1:1.
 */
export const dynamicParams = false;

/**
 * Beberapa slug WordPress memuat karakter non-ASCII yang disimpan ter-encode
 * (mis. "%ef%b7%ba"). Next.js memakai param yang SUDAH di-decode, jadi slug
 * di-decode untuk generateStaticParams dan dipetakan kembali saat membaca konten.
 */
const decodeSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
};
const storedSlug = (param: string) => (/[^\x00-\x7f]/.test(param) ? encodeURIComponent(param).toLowerCase() : param);

export async function generateStaticParams() {
  const posts = (await getAllPosts()).map((p) => ({ slug: decodeSlug(p.slug) }));
  const pages = (await getAllPages())
    .filter((p) => !p.path.includes("/") && !STATIC_ROUTES.has(p.path))
    .map((p) => ({ slug: p.path }));
  return [...posts, ...pages];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await initLocale(params);
  const slug = storedSlug(decodeSlug((await params).slug));
  const post = await getPost(slug);
  if (post) {
    // Hanya terjemahan yang SUDAH DITINJAU yang diindeks dan diberi hreflang; draf tetap noindex.
    const en = post.translation === "reviewed" ? { title: post.title, description: post.seo.description || post.excerpt } : undefined;
    return metadataFromSeo(post.seo, { title: post.title, path: `/${slug}/`, description: post.excerpt, en });
  }
  const page = await getPage(slug);
  if (page) return metadataFromSeo(page.seo, { title: page.title, path: `/${slug}/` });
  return {};
}

export default async function SlugPage({ params }: Props) {
  await initLocale(params);
  const slug = storedSlug(decodeSlug((await params).slug));

  const post = await getPost(slug);
  if (post) {
    return (
      <>
        <PostTemplate post={post} />
        <JsonLd data={post.seo.jsonLd ?? []} />
      </>
    );
  }

  const page = await getPage(slug);
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
