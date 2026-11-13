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

// Perbaikan SEO (disetujui 13 Nov 2026): title "New Beranda" & description
// "ScrollUntukEksplorasi" diganti; halaman kini punya satu H1.
const title = `${site.name} - Jembatan Kebaikan untuk Kemanusiaan`;
const description =
  "Relawan Nusantara adalah lembaga kemanusiaan yang menjadi jembatan kebaikan melalui aksi kemanusiaan, pendidikan, ekonomi, dan lingkungan di Indonesia dan dunia.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", type: "website", siteName: site.name, locale: site.locale },
};

export default function HomePage() {
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
