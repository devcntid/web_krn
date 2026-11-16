import type { Metadata } from "next";

import { pillarsContent } from "@/content/localized";
import { PillarPage, pillarMetadata } from "@/components/templates/PillarPage";
import { initLocale } from "@/i18n/request";

type LangProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: LangProps): Promise<Metadata> {
  await initLocale(params);
  return pillarMetadata(pillarsContent("id")["lingkungan"], pillarsContent("en")["lingkungan"]);
}

export default async function Page({ params }: LangProps) {
  const locale = await initLocale(params);
  return <PillarPage pillar={pillarsContent(locale)["lingkungan"]} />;
}
