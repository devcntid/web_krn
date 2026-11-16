import type { Metadata, Viewport } from "next";

import "./globals.css";
import { manrope, poppins, poppinsExtra } from "./fonts";
import { SITE_URL, site } from "@/config/site";
import { siteIcons } from "@/lib/site-icons";

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

/** Root layout: hanya <html>, font, dan metadata dasar. Kerangka situs ada di (site)/layout.tsx. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${poppins.variable} ${poppinsExtra.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
