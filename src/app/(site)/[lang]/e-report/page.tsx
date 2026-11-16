import type { Metadata } from "next";

import { SectionPage, sectionPageMetadata } from "@/components/site/sections/SectionPage";
import { englishSeo, reportsContent } from "@/content/localized";
import { initLocale } from "@/i18n/request";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ tema?: string | string[] }> };

const PATH = "e-report";

/** Metadata + meta description (kosong di halaman asli). Canonical tanpa ?tema=. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await initLocale(params);
  return sectionPageMetadata(PATH, englishSeo.reports, reportsContent("id").reportsPage.description);
}

/** Artboard "09 · e-Report": filter tema via ?tema=. Isi dikelola di /admin/halaman (section di database). */
export default async function Page({ params, searchParams }: Props) {
  await initLocale(params);
  return <SectionPage path={PATH} query={await searchParams} />;
}
