import type { Metadata } from "next";

import { SectionPage, sectionPageMetadata } from "@/components/site/sections/SectionPage";
import { englishSeo } from "@/content/localized";
import { initLocale } from "@/i18n/request";

type LangProps = { params: Promise<{ lang: string }> };

const PATH = "audit-keuangan";

/** Metadata dari SEO halaman (Rank Math hasil migrasi atau suntingan admin). */
export async function generateMetadata({ params }: LangProps): Promise<Metadata> {
  await initLocale(params);
  return sectionPageMetadata(PATH, englishSeo.audit);
}

/** Artboard "06 · Audit Keuangan". Isi dikelola di /admin/halaman (section di database). */
export default async function Page({ params }: LangProps) {
  await initLocale(params);
  return <SectionPage path={PATH} />;
}
