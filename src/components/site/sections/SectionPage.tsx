import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import { PreviewBanner } from "@/components/content/PreviewBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLocale } from "@/i18n/request";
import { getPage, getPagePreview } from "@/lib/content";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { type Section, localizedData, parseSections } from "@/server/sections";
import type { Page } from "@/types/content";

import { SectionRenderer } from "./SectionRenderer";
import type { SectionContext } from "./types";

/** Halaman untuk path ini. Dalam Draft Mode (pratinjau admin) juga mengembalikan halaman draf. */
export async function loadPage(path: string): Promise<{ page: Page | null; preview: boolean }> {
  if ((await draftMode()).isEnabled) {
    const page = await getPagePreview(path);
    if (page) return { page, preview: true };
  }
  return { page: await getPage(path), preview: false };
}

/** Judul tampilan halaman: judul hero (bahasa saat ini) bila diisi, selain itu judul halaman. */
function displayTitle(page: Page, sections: Section[], locale: string): string {
  const hero = sections.find((s) => s.type === "hero");
  return (hero?.type === "hero" && localizedData(hero, locale).title) || page.title;
}

/**
 * Metadata halaman berbasis section. `en` = judul & deskripsi Inggris (menandai halaman sudah
 * diterjemahkan → versi /en/ diindeks dan diberi hreflang).
 */
export async function sectionPageMetadata(path: string, en?: { title: string; description?: string }, description?: string): Promise<Metadata> {
  const { page, preview } = await loadPage(path);
  if (!page) return {};
  if (preview) return { title: `Pratinjau: ${page.title}`, robots: { index: false, follow: false } };
  return metadataFromSeo(page.seo, { title: page.title, path: `/${path}/`, en, description });
}

/**
 * Render halaman yang disusun dari section (`pages.sections`, template "sections").
 * Dipakai route khusus (Profil, Audit, Legalitas, Pilar, Program, Kemitraan, e-Report) dan
 * route generik [slug] untuk halaman baru dari admin.
 */
export async function SectionPage({ path, query = {} }: { path: string; query?: SectionContext["query"] }) {
  const locale = getLocale();
  const { page, preview } = await loadPage(path);
  if (!page) notFound();

  const sections = parseSections(page.sections).sections.filter((s) => s.visible);
  const ctx: SectionContext = { path: page.path, title: page.title, locale, query };

  // Halaman anak: induknya ikut di breadcrumb.
  const parentPath = page.path.includes("/") ? page.path.split("/").slice(0, -1).join("/") : null;
  const parent = parentPath ? await getPage(parentPath) : null;
  const crumbs = [
    { name: "Beranda", path: "/" },
    ...(parent && parentPath ? [{ name: displayTitle(parent, parseSections(parent.sections).sections, locale), path: `/${parentPath}/` }] : []),
    { name: displayTitle(page, sections, locale), path: `/${page.path}/` },
  ];

  const body = (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} ctx={ctx} />
      ))}
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {preview ? <PreviewBanner /> : null}
    </>
  );
  return page.template === "sections-muted" ? <div className="bg-surface-alt">{body}</div> : body;
}
