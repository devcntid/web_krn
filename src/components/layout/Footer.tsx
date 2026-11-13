import Image from "next/image";
import Link from "next/link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";

import { contact, footerNav, site, whatsappUrl } from "@/config/site";
import { getLatestPosts } from "@/lib/content";
import { formatDateShort } from "@/lib/format";
import { SocialIcons } from "@/components/ui/SocialIcons";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 inline-block border-b-4 border-primary pr-6 pb-2 font-manrope text-xl leading-5 font-bold text-[#1f1e17]">
      {children}
    </h2>
  );
}

/** Footer global (Divi Theme Builder) — Manrope, background krem. */
export function Footer() {
  const latest = getLatestPosts(2);

  return (
    <footer className="font-manrope">
      <div className="bg-cream py-12">
        <div className="mx-auto grid w-[90%] max-w-[1080px] gap-10 md:grid-cols-2 lg:w-[90%] lg:max-w-none xl:grid-cols-[376fr_161fr_215fr_215fr] xl:gap-8">
          {/* Kolom brand */}
          <div>
            <Link href="/" aria-label={site.name}>
              <Image src={site.logo.src} alt={site.name} width={160} height={36} className="h-9 w-auto" />
            </Link>
            <p className="mt-6 rounded-[10px] border border-dotted border-[#f05e22] p-[30px] text-[15px] leading-[1.5] font-medium text-muted">
              Dana yang didonasikan melalui Relawan Nusantara adalah milik sah, bukan berasal dari sumber yang
              tidak halal, dan tidak digunakan untuk pencucian uang, terorisme, atau kejahatan lainnya
            </p>
            <p className="mt-14 pl-[105px] text-[13px] leading-[1.3] font-medium text-muted italic max-sm:pl-0">
              Relawan Nusantara telah meraih predikat opini Wajar Tanpa Pengecualian pada laporan keuangan
              2021 – 2025 Sesuai Standar Akuntansi Keuangan Indonesia
            </p>
          </div>

          {/* Eksplor */}
          <nav aria-label="Eksplor">
            <FooterHeading>Eksplor</FooterHeading>
            <ul className="space-y-4">
              {footerNav.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    {...("external" in item && item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-2 text-[15px] font-medium text-muted transition-colors hover:text-primary"
                  >
                    <Leaf aria-hidden className="size-4 fill-current" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Publikasi terbaru */}
          <div>
            <FooterHeading>Publikasi</FooterHeading>
            <ul className="divide-y divide-[#e5e3d8] border-b border-[#e5e3d8]">
              {latest.map((post) => (
                <li key={post.slug} className="py-3 first:pt-0">
                  <Link
                    href={`/${post.slug}/`}
                    className="block text-[15px] leading-[18px] font-bold text-muted transition-colors hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <time dateTime={post.date} className="mt-2 block text-[13px] leading-[26px] text-[#f1b51c]">
                    {formatDateShort(post.date)}
                  </time>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <FooterHeading>
              Hubungi
              <br />
              Kami
            </FooterHeading>
            <ul className="space-y-4 text-[15px] leading-[25.5px] font-medium text-muted">
              <li className="flex gap-3">
                <Phone aria-hidden className="mt-1 size-4 shrink-0 fill-accent text-accent" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
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
            <SocialIcons className="mt-8" />
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
