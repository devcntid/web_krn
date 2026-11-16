import Image from "next/image";
import { Mail, Phone } from "lucide-react";

import { Link } from "@/i18n/Link";
import { mediaUrl } from "@/lib/media";
import type { SectionData } from "@/server/sections";

const ctaButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-8 py-3 text-[15px] font-semibold text-ink transition-opacity hover:opacity-90";

/** Banner hijau dengan satu tombol (CTA donasi halaman pilar). */
export function CtaBanner({ data }: { data: SectionData<"cta-banner"> }) {
  return (
    <section className="pb-14 md:pb-20">
      <div className="container-site grid items-center gap-6 rounded-[20px] bg-primary p-7 text-white md:grid-cols-[2fr_1fr] md:gap-8 md:p-12">
        <div>
          <h2 className="text-[26px] leading-[1.2] font-bold text-white md:text-[34px]">{data.heading}</h2>
          <p className="mt-3 text-base leading-[1.6]">{data.description}</p>
        </div>
        <a
          href={data.href}
          className="inline-flex min-h-11 items-center justify-center justify-self-start rounded-full bg-accent px-10 py-3.5 font-semibold text-ink transition-opacity hover:opacity-90 md:justify-self-end"
        >
          {data.label}
        </a>
      </div>
    </section>
  );
}

/** Judul + kartu bergambar dengan tombol (halaman Program Kami). `external` = tujuan di luar aplikasi ini (mis. /donasi). */
export function CtaCards({ data }: { data: SectionData<"cta-cards"> }) {
  return (
    <section className="pb-14 md:pb-20">
      <div className="container-site">
        <div className="text-center">
          <h2 className="text-[28px] font-bold md:text-[36px]">{data.heading}</h2>
          <p className="mx-auto mt-3 max-w-[760px] text-base leading-[1.6] text-body-strong">{data.description}</p>
        </div>
        <ul className="mt-8 grid gap-5 md:grid-cols-2 md:gap-6">
          {data.cards.map((card) => (
            <li key={card.label} className="relative flex aspect-[16/10] items-end overflow-hidden rounded-[20px] bg-primary p-6 md:p-8">
              <Image src={mediaUrl(card.image.src)} alt="" fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
              {card.external ? (
                <a href={card.href} className={`relative ${ctaButton}`}>
                  {card.label}
                </a>
              ) : (
                <Link href={card.href} className={`relative ${ctaButton}`}>
                  {card.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** CTA hijau penuh dengan kontak (telepon, email) dan peta tersemat (artboard "08 · Kemitraan"). */
export function CtaContact({ data }: { data: SectionData<"cta-contact"> }) {
  return (
    <section className="bg-primary py-12 text-white md:py-[72px]">
      <div className="container-site grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <h2 className="text-[28px] font-bold text-white md:text-[36px]">{data.heading}</h2>
          <p className="mt-2 text-base leading-[1.6]">{data.description}</p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { label: data.phoneLabel, display: data.phoneDisplay, href: data.phoneHref, Icon: Phone },
              { label: data.emailLabel, display: data.emailDisplay, href: data.emailHref, Icon: Mail },
            ].map(({ label, display, href, Icon }) => (
              <div key={label}>
                <dt className="flex items-center gap-2 text-sm font-bold tracking-[0.06em]">
                  <Icon aria-hidden className="size-4" />
                  {label}
                </dt>
                <dd className="mt-1">
                  <a href={href} className="inline-flex min-h-11 items-center underline underline-offset-4 [overflow-wrap:anywhere] hover:no-underline">
                    {display}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
          <a
            href={data.emailHref}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-9 py-3.5 font-semibold text-ink transition-opacity hover:opacity-90"
          >
            {data.buttonLabel}
          </a>
        </div>
        <iframe
          src={data.mapSrc}
          title={data.mapTitle}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="block aspect-[4/3] w-full rounded-[20px] border-0 bg-surface-alt"
        />
      </div>
    </section>
  );
}
