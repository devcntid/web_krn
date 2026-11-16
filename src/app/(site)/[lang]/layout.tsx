import { notFound } from "next/navigation";

import { isLocale, LOCALES } from "@/i18n/config";
import { initLocale } from "@/i18n/request";
import { SiteShell } from "@/components/layout/SiteShell";

type Props = Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>;

/** Semua route publik dirender untuk dua bahasa: /… (id, lewat rewrite) dan /en/…. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/** Layout situs publik. Route di luar group ini (mis. /admin) tidak mendapat header/footer situs. */
export default async function SiteLayout({ children, params }: Props) {
  if (!isLocale((await params).lang)) notFound();
  const locale = await initLocale(params);
  return <SiteShell locale={locale}>{children}</SiteShell>;
}
