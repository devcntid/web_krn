import type { Metadata } from "next";

import { SectionPage, sectionPageMetadata } from "@/components/site/sections/SectionPage";
import { programsContent } from "@/content/localized";
import { initLocale } from "@/i18n/request";

type LangProps = { params: Promise<{ lang: string }> };

const PATH = "pr0gram-kami/kerelawanan";

export async function generateMetadata({ params }: LangProps): Promise<Metadata> {
  await initLocale(params);
  // Judul & deskripsi Inggris masih dari src/content/en (menandai halaman sudah diterjemahkan).
  const english = programsContent("en").subPrograms.kerelawanan;
  return sectionPageMetadata(PATH, { title: english.title, description: english.description });
}

/** Artboard "04 · Pilar Program". Isi dikelola di /admin/halaman (section di database). */
export default async function Page({ params }: LangProps) {
  await initLocale(params);
  return <SectionPage path={PATH} />;
}
