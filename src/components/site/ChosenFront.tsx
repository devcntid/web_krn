import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PreviewBanner } from "@/components/content/PreviewBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { SectionPage, loadPage, sectionPageMetadata } from "@/components/site/sections/SectionPage";
import { GenericPageTemplate } from "@/components/templates/GenericPageTemplate";
import { PublicationListing } from "@/components/templates/PublicationListing";
import { englishSeo, pillarsContent, programsContent, reportsContent } from "@/content/localized";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { isSectionTemplate } from "@/server/sections";

type Query = Record<string, string | string[] | undefined>;

/** Judul Inggris agar /en/ halaman yang sudah diterjemahkan tetap terindeks saat jadi beranda. */
function englishFor(path: string): { title: string; description?: string } | undefined {
  switch (path) {
    case "profil-relawan-nusantara":
      return englishSeo.profile;
    case "audit-keuangan":
      return englishSeo.audit;
    case "asas-legalitas":
      return englishSeo.legal;
    case "kemitraan":
      return englishSeo.partnership;
    case "pr0gram-kami":
      return englishSeo.programs;
    case "e-report":
      return englishSeo.reports;
    case "pr0gram-kami/kerelawanan":
    case "pr0gram-kami/kebencanaan": {
      const english = programsContent("en").subPrograms[path.endsWith("kerelawanan") ? "kerelawanan" : "kebencanaan"];
      return { title: english.title, description: english.description };
    }
    default: {
      const pillars = pillarsContent("en");
      if (Object.prototype.hasOwnProperty.call(pillars, path)) {
        const english = pillars[path as keyof typeof pillars];
        return { title: english.title, description: english.description };
      }
      return undefined;
    }
  }
}

/** Metadata beranda ketika isinya halaman lain. Canonical tetap /. */
export async function chosenFrontMetadata(path: string): Promise<Metadata> {
  if (path === "artikel" || path === "berita") {
    const title = path === "artikel" ? "Artikel" : "Berita";
    return metadataFromSeo((await loadPage(path)).page?.seo, {
      title,
      path: "/",
      description: "Cerita tentang langkah-langkah kecil dari Nusantara yang menjadi kekuatan besar bagi kemanusiaan",
    });
  }
  const loaded = await loadPage(path);
  if (loaded.page && isSectionTemplate(loaded.page.template)) {
    const description = path === "e-report" ? reportsContent("id").reportsPage.description : undefined;
    return sectionPageMetadata(path, englishFor(path), description, "/");
  }
  if (loaded.page) return metadataFromSeo(loaded.page.seo, { title: loaded.page.title, path: "/" });
  return {};
}

/** Isi beranda ketika pengaturan situs menunjuk ke halaman lain. */
export async function ChosenFront({ path, query }: { path: string; query: Query }) {
  if (path === "artikel" || path === "berita") {
    return (
      <PublicationListing
        title={path === "artikel" ? "Artikel" : "Berita"}
        basePath="/"
        defaultCategory={path}
        searchParams={Promise.resolve(query)}
      />
    );
  }
  const { page, preview } = await loadPage(path);
  if (page && isSectionTemplate(page.template)) return <SectionPage path={path} query={query} asHome />;
  if (page) {
    return (
      <>
        <GenericPageTemplate page={page} />
        <JsonLd data={breadcrumbJsonLd([{ name: page.title, path: "/" }])} />
        {preview ? <PreviewBanner /> : null}
      </>
    );
  }
  notFound();
}
