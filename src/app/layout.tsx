import type { Metadata, Viewport } from "next";

import "./globals.css";
import { manrope, poppins } from "./fonts";
import { SITE_URL, site } from "@/config/site";
import { organizationJsonLd } from "@/lib/seo";
import { siteIcons } from "@/lib/site-icons";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Analytics } from "@/components/layout/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} - Jembatan Kebaikan untuk Kemanusiaan`,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  icons: siteIcons(),
  openGraph: {
    siteName: site.name,
    locale: site.locale,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#006659",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${poppins.variable} ${manrope.variable}`}>
      <body>
        <a
          href="#konten"
          className="sr-only z-[60] rounded bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Lewati ke konten
        </a>
        <Header />
        <main id="konten">{children}</main>
        <Footer />
        <FloatingContact />
        <JsonLd data={organizationJsonLd()} />
        <Analytics />
      </body>
    </html>
  );
}
