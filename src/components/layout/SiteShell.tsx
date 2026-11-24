import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { organizationJsonLd } from "@/lib/seo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Analytics } from "@/components/layout/Analytics";
import { SiteCode } from "@/components/layout/SiteCode";
import { JsonLd } from "@/components/seo/JsonLd";
import { whatsappHref } from "@/lib/site-settings-schema";
import { getSiteSettings } from "@/server/site-settings";

/**
 * Kerangka situs publik: tautan lewati, Header, <main>, Footer, "Tanya Saffa",
 * JSON-LD organisasi, dan analytics. Dipakai layout route group (site) dan 404
 * tingkat root — tidak dipakai /admin.
 */
export async function SiteShell({ children, locale = "id" }: Readonly<{ children: React.ReactNode; locale?: Locale }>) {
  const t = getDictionary(locale);
  const { identity, contact, menu, integrations, codes } = await getSiteSettings();
  const saffaHref = whatsappHref(contact.whatsapp);
  return (
    // <html lang> di root layout tetap "id"; versi Inggris ditandai di pembungkus ini.
    <div lang={locale}>
      <a
        href="#konten"
        className="sr-only z-[60] rounded bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t.shell.skipToContent}
      </a>
      <Header shell={{ name: identity.name, logo: identity.logo, menu, donateUrl: integrations.donateUrl, saffa: { href: saffaHref, show: integrations.showSaffa } }} />
      <main id="konten">{children}</main>
      <Footer />
      {integrations.showSaffa && <FloatingContact href={saffaHref} />}
      <JsonLd data={organizationJsonLd({ name: identity.name, logo: identity.logo.src })} />
      <Analytics gaId={integrations.ga4Id} pixelId={integrations.metaPixelId} />
      <SiteCode snippets={codes.snippets} />
    </div>
  );
}
