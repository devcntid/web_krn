import type { Metadata, Viewport } from "next";

import "./globals.css";
import { manrope, poppins, poppinsExtra } from "./fonts";
import { SITE_URL, site } from "@/config/site";
import { siteIcons } from "@/lib/site-icons";
import { mediaUrl } from "@/lib/media";
import { getSiteSettings } from "@/server/site-settings";

/** Favicon dari /admin/pengaturan (kosong = ikon hasil ekspor WordPress). */
export async function generateMetadata(): Promise<Metadata> {
  const { identity } = await getSiteSettings();
  const favicon = identity.favicon ? mediaUrl(identity.favicon) : "";
  return {
    ...baseMetadata,
    applicationName: identity.name,
    title: { default: identity.documentTitle, template: `%s - ${identity.name}` },
    openGraph: { ...baseMetadata.openGraph, siteName: identity.name },
    icons: favicon ? { icon: [{ url: favicon }], apple: [{ url: favicon }] } : siteIcons(),
  };
}

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} - Jembatan Kebaikan untuk Kemanusiaan`,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    siteName: site.name,
    locale: site.locale,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#006659",
};

/** Root layout: hanya <html>, font, dan metadata dasar. Kerangka situs ada di (site)/layout.tsx. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${poppins.variable} ${poppinsExtra.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
