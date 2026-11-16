import type { Metadata } from "next";

import { getPage } from "@/lib/content";
import { metadataFromSeo } from "@/lib/seo";
import { PublicationListing, type ListingSearchParams } from "@/components/templates/PublicationListing";
import { initLocale } from "@/i18n/request";

type LangProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: LangProps): Promise<Metadata> {
  await initLocale(params);
  return metadataFromSeo((await getPage("artikel"))?.seo, {
    title: "Artikel",
    path: "/artikel/",
    description: "Cerita tentang langkah-langkah kecil dari Nusantara yang menjadi kekuatan besar bagi kemanusiaan",
  });
}

export default async function ArtikelPage({ params, searchParams }: { searchParams: ListingSearchParams } & LangProps) {
  await initLocale(params);
  return <PublicationListing title="Artikel" basePath="/artikel/" defaultCategory="artikel" searchParams={searchParams} />;
}
