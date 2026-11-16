import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import { getAllPages, getAllPosts, getPost, getPostPreview } from "@/lib/content";
import { articleJsonLd, breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { STATIC_ROUTES } from "@/config/routes";
import { PostTemplate } from "@/components/templates/PostTemplate";
import { GenericPageTemplate } from "@/components/templates/GenericPageTemplate";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { SectionPage, loadPage, sectionPageMetadata } from "@/components/site/sections/SectionPage";
import { isSectionTemplate } from "@/server/sections";
import { JsonLd } from "@/components/seo/JsonLd";
import { initLocale } from "@/i18n/request";

type Props = { params: Promise<{ slug: string }> };

/**
 * Post (permalink /%postname%/) dan halaman level atas yang tidak punya
 * route khusus. Slug WordPress dipertahankan 1:1.
 *
 * `dynamicParams = true`: post yang terbit dari admin setelah build dirender saat pertama
 * diminta (lalu di-cache dan disegarkan lewat tag `post:<slug>`); slug yang tidak ada → 404.
 * Ini juga yang memungkinkan pratinjau draf (Draft Mode) untuk slug yang belum pernah dibangun.
 */
export const dynamicParams = true;

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

/** Post untuk slug ini. Dalam Draft Mode (pratinjau admin) juga mengembalikan post yang belum terbit. */
async function loadPost(slug: string) {
  if ((await draftMode()).isEnabled) {
    const preview = await getPostPreview(slug);
    if (preview) return { post: preview, preview: true };
  }
  return { post: await getPost(slug), preview: false };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await initLocale(params);
  const slug = storedSlug(decodeSlug((await params).slug));
  const { post, preview } = await loadPost(slug);
  if (post && preview) return { title: `Pratinjau: ${post.title}`, robots: { index: false, follow: false } };
  if (post) {
    // Hanya terjemahan yang SUDAH DITINJAU yang diindeks dan diberi hreflang; draf tetap noindex.
    const en = post.translation === "reviewed" ? { title: post.title, description: post.seo.description || post.excerpt } : undefined;
    return metadataFromSeo(post.seo, { title: post.title, path: `/${slug}/`, description: post.excerpt, en });
  }
  const { page, preview: pagePreview } = await loadPage(slug);
  if (page && (pagePreview || isSectionTemplate(page.template))) return sectionPageMetadata(slug);
  if (page) return metadataFromSeo(page.seo, { title: page.title, path: `/${slug}/` });
  return {};
}

export default async function SlugPage({ params }: Props) {
  await initLocale(params);
  const slug = storedSlug(decodeSlug((await params).slug));

  const { post, preview } = await loadPost(slug);
  if (post) {
    return (
      <>
        <PostTemplate post={post} />
        {/* Post lama membawa JSON-LD asli Rank Math; post baru dari admin diberi BlogPosting. */}
        <JsonLd data={post.seo.jsonLd?.length ? post.seo.jsonLd : articleJsonLd(post)} />
        {preview ? <PreviewBanner /> : null}
      </>
    );
  }

  const { page, preview: pagePreview } = await loadPage(slug);
  // Halaman yang disusun dari section di admin (/admin/halaman).
  if (page && isSectionTemplate(page.template)) return <SectionPage path={slug} />;
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
        {pagePreview ? <PreviewBanner /> : null}
      </>
    );
  }

  notFound();
}
