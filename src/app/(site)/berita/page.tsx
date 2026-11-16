import type { Metadata } from "next";

import { getPage } from "@/lib/content";
import { metadataFromSeo } from "@/lib/seo";
import { PublicationListing, type ListingSearchParams } from "@/components/templates/PublicationListing";

export async function generateMetadata(): Promise<Metadata> {
  return metadataFromSeo((await getPage("berita"))?.seo, {
    title: "Berita",
    path: "/berita/",
    description: "Cerita tentang langkah-langkah kecil dari Nusantara yang menjadi kekuatan besar bagi kemanusiaan",
  });
}

export default function BeritaPage({ searchParams }: { searchParams: ListingSearchParams }) {
  return <PublicationListing title="Berita" basePath="/berita/" defaultCategory="berita" searchParams={searchParams} />;
}
