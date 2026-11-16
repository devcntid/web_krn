import type { Metadata } from "next";

import { site } from "@/config/site";
import { HeroSlider } from "@/components/home/HeroSlider";
import {
  IntroSection,
  PillarsSection,
  PublicationsSection,
  ReportCtaSection,
  TestimonialsSection,
} from "@/components/home/HomeSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/config/site";
import { englishSeo } from "@/content/localized";
import { initLocale } from "@/i18n/request";
import { languageAlternates } from "@/lib/seo";

type LangProps = { params: Promise<{ lang: string }> };

// Perbaikan SEO (disetujui 13 Nov 2026): title "New Beranda" & description
// "ScrollUntukEksplorasi" diganti; halaman kini punya satu H1.
const SEO = {
  id: {
    title: `${site.name} - Jembatan Kebaikan untuk Kemanusiaan`,
    description:
      "Relawan Nusantara adalah lembaga kemanusiaan yang menjadi jembatan kebaikan melalui aksi kemanusiaan, pendidikan, ekonomi, dan lingkungan di Indonesia dan dunia.",
  },
  en: englishSeo.home,
};

export async function generateMetadata({ params }: LangProps): Promise<Metadata> {
  const locale = await initLocale(params);
  const { title, description } = SEO[locale];
  const url = locale === "en" ? "/en/" : "/";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates("/") },
    openGraph: { title, description, url, type: "website", siteName: site.name, locale: locale === "en" ? "en_US" : site.locale },
  };
}

export default async function HomePage({ params }: LangProps) {
  const { title } = SEO[await initLocale(params)];
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      <HeroSlider />
      <IntroSection />
      <PillarsSection />
      <PublicationsSection />
      <TestimonialsSection />
      <ReportCtaSection />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/?s={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}
