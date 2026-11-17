import { localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/request";
import Image from "next/image";
import { Link } from "@/i18n/Link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";

import { footerNav } from "@/config/site";
import { whatsappHref } from "@/lib/site-settings-schema";
import { getSiteSettings } from "@/server/site-settings";
import { getLatestPosts } from "@/lib/content";
import { formatDateShort } from "@/lib/format";
import { SocialIcons } from "@/components/ui/SocialIcons";
import { mediaUrl } from "@/lib/media";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 inline-block border-b-4 border-primary pr-6 pb-2 font-manrope text-xl leading-5 font-bold text-[#1f1e17]">
      {children}
    </h2>
  );
}

/** Footer global (Divi Theme Builder) — Manrope, background krem. */
/** Lencana WTP di footer WordPress (blurb kiri teks predikat opini). */
const WTP_BADGE = "/wp-content/uploads/2026/09/2021-2025-scaled.png";

export async function Footer() {
  const [latest, { identity, contact, socials }] = await Promise.all([getLatestPosts(2), getSiteSettings()]);
  const locale = getLocale();
  const t = getDictionary(locale);

  return (
    <footer className="font-manrope">
      <div className="bg-cream py-12">
        <div className="mx-auto grid w-[90%] max-w-[1080px] gap-10 md:grid-cols-2 lg:w-[90%] lg:max-w-none xl:grid-cols-[376fr_161fr_215fr_215fr] xl:gap-8">
          {/* Kolom brand */}
          <div>
            <Link href="/" aria-label={identity.name}>
              <Image src={mediaUrl(identity.logo.src)} alt={identity.name} width={identity.logo.width} height={identity.logo.height} className="h-9 w-auto" />
            </Link>
            <p className="mt-6 rounded-[10px] border border-dotted border-[#f05e22] p-[30px] text-[15px] leading-[1.5] font-medium text-muted-strong">
              {t.footer.disclaimer}
            </p>
            {/* Blurb Divi: lencana opini WTP di kiri, teks di kanan */}
            <div className="mt-10 flex items-center gap-4">
              <Image
                src={mediaUrl(WTP_BADGE)}
                alt={t.footer.wtpBadgeAlt}
                width={480}
                height={480}
                sizes="88px"
                className="size-[88px] shrink-0"
              />
              <p className="text-[13px] leading-[1.3] font-medium text-muted-strong italic">
                {t.footer.wtp}
              </p>
            </div>
          </div>

          {/* Eksplor */}
          <nav aria-label={t.footer.explore}>
            <FooterHeading>{t.footer.explore}</FooterHeading>
            <ul className="space-y-4">
              {footerNav.map((item) => (
                <li key={item.label}>
                  <a
                    href={localePath(item.href, locale)}
                    {...("external" in item && item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-2 text-[15px] font-medium text-muted-strong transition-colors hover:text-primary"
                  >
                    <Leaf aria-hidden className="size-4 fill-current" />
                    {t.nav[item.label] ?? item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Publikasi terbaru */}
          <div>
            <FooterHeading>{t.footer.publications}</FooterHeading>
            <ul className="divide-y divide-[#e5e3d8] border-b border-[#e5e3d8]">
              {latest.map((post) => (
                <li key={post.slug} className="py-3 first:pt-0">
                  <Link
                    href={`/${post.slug}/`}
                    className="block text-[15px] leading-[18px] font-bold text-muted-strong transition-colors hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <time dateTime={post.date} className="mt-2 block text-[13px] leading-[26px] text-accent-700">
                    {formatDateShort(post.date)}
                  </time>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <FooterHeading>
              <span className="whitespace-nowrap">
                {t.footer.contact[0]} {t.footer.contact[1]}
              </span>
            </FooterHeading>
            <ul className="space-y-4 text-[15px] leading-[25.5px] font-medium text-muted-strong">
              <li className="flex gap-3">
                <Phone aria-hidden className="mt-1 size-4 shrink-0 fill-accent text-accent" />
                <a href={whatsappHref(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  {contact.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-primary">
                  {contact.email}
                </a>
              </li>
              <li className="flex gap-3">
                <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-accent" />
                <address className="not-italic">{contact.address}</address>
              </li>
            </ul>
            <SocialIcons socials={socials} className="mt-8" />
          </div>
        </div>
      </div>

      <div className="bg-primary py-6 text-center text-sm leading-[23.8px] text-white">
        {/* Di WordPress kedua tautan masih "#" — halaman belum tersedia */}
        <span>Terms of Use</span> | <span>Privacy Policy</span>
      </div>
    </footer>
  );
}
