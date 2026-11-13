import type { Metadata } from "next";

import { getPage } from "@/lib/content";
import { metadataFromSeo } from "@/lib/seo";
import { PublicationListing, type ListingSearchParams } from "@/components/templates/PublicationListing";

export function generateMetadata(): Metadata {
  return metadataFromSeo(getPage("artikel")?.seo, {
    title: "Artikel",
    path: "/artikel/",
    description: "Cerita tentang langkah-langkah kecil dari Nusantara yang menjadi kekuatan besar bagi kemanusiaan",
  });
}

export default function ArtikelPage({ searchParams }: { searchParams: ListingSearchParams }) {
  return <PublicationListing title="Artikel" basePath="/artikel/" defaultCategory="artikel" searchParams={searchParams} />;
}
