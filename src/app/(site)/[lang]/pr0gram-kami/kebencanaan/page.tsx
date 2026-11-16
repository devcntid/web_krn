import type { Metadata } from "next";

import { programsContent } from "@/content/localized";
import { PillarPage, pillarMetadata } from "@/components/templates/PillarPage";
import { initLocale } from "@/i18n/request";

type LangProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: LangProps): Promise<Metadata> {
  await initLocale(params);
  return pillarMetadata(programsContent("id").subPrograms.kebencanaan, programsContent("en").subPrograms.kebencanaan);
}

export default async function Page({ params }: LangProps) {
  const locale = await initLocale(params);
  return <PillarPage pillar={programsContent(locale).subPrograms.kebencanaan} />;
}
