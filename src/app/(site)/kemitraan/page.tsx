import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";

import { testimonials } from "@/content/home";
import {
  partnerLogos,
  partnershipCta,
  partnershipHero,
  partnershipPartners,
  partnershipSteps,
  partnershipStories,
  partnershipTestimonials,
  partnershipWhy,
} from "@/content/partnership";
import { getPage, getPostsByCategory } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { StoriesSection } from "@/components/sections/StoriesSection";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { JsonLd } from "@/components/seo/JsonLd";

const PATH = "kemitraan";

/** Metadata dari SEO Rank Math halaman WordPress. */
export function generateMetadata(): Metadata {
  const page = getPage(PATH);
  if (!page) return {};
  return metadataFromSeo(page.seo, { title: page.title, path: `/${PATH}/` });
}

function PartnerLogo({ logo, hidden = false }: { logo: (typeof partnerLogos)[number]; hidden?: boolean }) {
  return (
    <li aria-hidden={hidden || undefined} className="relative mx-3 h-[72px] w-[150px] shrink-0 rounded-[10px] bg-white md:mx-4">
      <Image src={mediaUrl(logo.src)} alt={hidden ? "" : logo.name} fill sizes="150px" className="object-contain p-2.5" />
    </li>
  );
}

/**
 * Rekonstruksi artboard "08 · Kemitraan". Data: src/content/partnership.ts.
 * Halaman asli punya dua H1 ("Jaringan Kebaikan" dan "Mengapa Berkolaborasi dengan Kami?");
 * di sini hanya judul hero yang H1.
 */
export default function PartnershipPage() {
  const page = getPage(PATH);
  if (!page) notFound();
  const stories = getPostsByCategory(partnershipStories.category).slice(0, partnershipStories.count);

  return (
    <div className="bg-surface-alt">
      <PageHero title={page.title} image={partnershipHero.image} size="medium" width="container" overlay={0.35} />

      {/* Empat langkah */}
      <section className="py-12 md:py-20">
        <div className="container-site text-center">
          <h2 className="text-[30px] leading-[1.15] font-extrabold md:text-[40px] lg:text-[45px]">{partnershipSteps.heading}</h2>
          <ol className="mt-9 grid gap-8 sm:grid-cols-2 md:mt-12 lg:grid-cols-4 lg:gap-7">
            {partnershipSteps.items.map((step) => (
              <li key={step.title} className="flex flex-col items-center gap-3.5">
                <Image
                  src={mediaUrl(step.icon)}
                  alt=""
                  width={partnershipSteps.iconSize}
                  height={partnershipSteps.iconSize}
                  sizes="88px"
                  className="size-[88px]"
                />
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-[15px] leading-[1.6] text-body-strong">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Mengapa berkolaborasi */}
      <section className="pb-12 md:pb-20">
        <div className="container-site grid items-center gap-8 md:grid-cols-2 md:gap-10">
          <div>
            <h2 className="mb-6 text-center text-[28px] leading-[1.2] font-bold md:text-[34px]">{partnershipWhy.heading}</h2>
            <ul className="flex flex-col gap-3.5">
              {partnershipWhy.items.map((item) => (
                <li key={item.title} className="rounded-[10px] bg-white px-[22px] py-5 shadow-card">
                  <h3 className="text-[17px] leading-[1.3] font-bold">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-body-strong">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <Image
            src={mediaUrl(partnershipWhy.image.src)}
            alt={partnershipWhy.image.alt}
            width={partnershipWhy.image.width}
            height={partnershipWhy.image.height}
            sizes="(min-width: 768px) 40vw, 90vw"
            className="mx-auto h-auto w-full max-w-[510px] rounded-[20px]"
          />
        </div>
      </section>

      {/* Testimoni */}
      <section className="pb-12 md:pb-20">
        <div className="container-site text-center">
          <h2 className="text-[30px] leading-[1.15] font-bold md:text-[40px] lg:text-[45px]">{partnershipTestimonials.heading}</h2>
          <p className="mx-auto mt-2 max-w-[860px] text-base leading-[1.5] text-ink">{partnershipTestimonials.description}</p>
        </div>
        <div className="container-site mt-7">
          <TestimonialCarousel items={testimonials.items} />
        </div>
      </section>

      <StoriesSection
        posts={stories}
        label="Cerita berdampak kemitraan"
        href={partnershipStories.href}
        heading={partnershipStories.heading}
        showExcerpt
      />

      {/* Logo mitra */}
      <section className="bg-white py-12 md:py-[72px]">
        <div className="container-site text-center">
          <h2 className="text-[28px] leading-[1.15] font-bold md:text-[36px] lg:text-[45px]">{partnershipPartners.heading}</h2>
          <p className="mt-3 text-base text-ink">{partnershipPartners.description}</p>
        </div>
        <div className="marquee mt-8 overflow-hidden md:mt-10">
          <ul className="marquee-track gap-y-4" aria-label="Mitra Relawan Nusantara">
            {partnerLogos.map((logo) => (
              <PartnerLogo key={logo.src} logo={logo} />
            ))}
            {partnerLogos.map((logo) => (
              <PartnerLogo key={`dup-${logo.src}`} logo={logo} hidden />
            ))}
          </ul>
        </div>
      </section>

      {/* CTA + kontak kemitraan */}
      <section className="bg-primary py-12 text-white md:py-[72px]">
        <div className="container-site grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="text-[28px] font-bold text-white md:text-[36px]">{partnershipCta.heading}</h2>
            <p className="mt-2 text-base leading-[1.6]">{partnershipCta.description}</p>
            <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              {[
                { ...partnershipCta.phone, Icon: Phone },
                { ...partnershipCta.email, Icon: Mail },
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
              href={partnershipCta.email.href}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-9 py-3.5 font-semibold text-ink transition-opacity hover:opacity-90"
            >
              {partnershipCta.buttonLabel}
            </a>
          </div>
          <iframe
            src={partnershipCta.map.src}
            title={partnershipCta.map.title}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="block aspect-[4/3] w-full rounded-[20px] border-0 bg-surface-alt"
          />
        </div>
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/" },
          { name: page.title, path: `/${PATH}/` },
        ])}
      />
    </div>
  );
}
