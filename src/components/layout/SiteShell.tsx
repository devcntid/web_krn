import { organizationJsonLd } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Analytics } from "@/components/layout/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * Kerangka situs publik: tautan lewati, Header, <main>, Footer, "Tanya Saffa",
 * JSON-LD organisasi, dan analytics. Dipakai layout route group (site) dan 404
 * tingkat root — tidak dipakai /admin.
 */
export function SiteShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
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
    </>
  );
}
