import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { programKami } from "@/content/programs";
import { getLatestPosts, getPage } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { StoriesSection } from "@/components/sections/StoriesSection";
import { JsonLd } from "@/components/seo/JsonLd";

const PATH = programKami.path;

const ctaButton =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-8 py-3 text-[15px] font-semibold text-ink transition-opacity hover:opacity-90";

/** Metadata dari SEO Rank Math halaman WordPress. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(PATH);
  if (!page) return {};
  return metadataFromSeo(page.seo, { title: page.title, path: `/${PATH}/` });
}

/** /pr0gram-kami/ — struktur mengikuti halaman asli. Data: src/content/programs.ts. */
export default async function ProgramKamiPage() {
  const page = await getPage(PATH);
  if (!page) notFound();
  const { approach, pillars, stories, cta } = programKami;

  return (
    <>
      <PageHero title={page.title} image={programKami.hero} width="container" overlay={0.4} />

      {/* Cara kerja: tiga baris gambar + teks berselang-seling */}
      <section className="py-12 md:py-20">
        <div className="container-site">
          <h2 className="text-center text-[30px] leading-[1.1] font-extrabold italic md:text-[40px] lg:text-[45px]">{approach.heading}</h2>
          <div className="mt-10 flex flex-col gap-10 md:mt-16 md:gap-16">
            {approach.items.map((item, i) => (
              <div key={item.title} className="grid items-center gap-6 md:grid-cols-2 md:gap-[60px]">
                <div className={`relative aspect-[16/9] overflow-hidden rounded-[20px] bg-surface-alt ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <Image
                    src={mediaUrl(item.image.src)}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 45vw, 90vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl leading-[1.2] font-bold md:text-[28px]">{item.title}</h3>
                  <div className="mt-4 space-y-3 text-base leading-[1.6] text-body-strong">
                    {item.paragraphs.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Empat pilar */}
      <section className="bg-surface-alt py-12 md:py-[72px]">
        <div className="container-site">
          <h2 className="text-[28px] leading-[1.2] font-bold md:text-[36px]">
            {pillars.heading[0]}
            <br />
            {pillars.heading[1]}
          </h2>
          <ul className="mt-7 grid gap-5 md:mt-9 md:grid-cols-2 md:gap-6">
            {pillars.items.map((item) => (
              <li key={item.href} className="flex flex-col overflow-hidden rounded-[10px] bg-white shadow-card">
                <div className="relative aspect-[661/320] bg-surface-alt">
                  <Image src={mediaUrl(item.image.src)} alt="" fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-5 md:p-7">
                  <h3 className="text-xl font-bold md:text-2xl">{item.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-[1.6] text-body">{item.description}</p>
                  <Link
                    href={item.href}
                    className="group mt-4 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-primary"
                  >
                    {pillars.linkLabel}
                    <span className="sr-only">: {item.title}</span>
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StoriesSection posts={(await getLatestPosts(stories.count))} label="Cerita berdampak" href={stories.href} />

      {/* CTA: mitra & donasi */}
      <section className="pb-14 md:pb-20">
        <div className="container-site">
          <div className="text-center">
            <h2 className="text-[28px] font-bold md:text-[36px]">{cta.heading}</h2>
            <p className="mx-auto mt-3 max-w-[760px] text-base leading-[1.6] text-body-strong">{cta.description}</p>
          </div>
          <ul className="mt-8 grid gap-5 md:grid-cols-2 md:gap-6">
            {cta.cards.map((card) => (
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

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/" },
          { name: page.title, path: `/${PATH}/` },
        ])}
      />
    </>
  );
}
