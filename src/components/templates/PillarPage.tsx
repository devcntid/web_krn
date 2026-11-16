import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PILLAR_STORY_COUNT, PILLAR_STORY_MIN, type Pillar } from "@/content/pillars";
import { getAllPosts, getLatestPosts, getPage } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import type { PostSummary } from "@/types/content";
import { PostCard } from "@/components/cards/PostCard";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { Carousel } from "@/components/ui/Carousel";

/** Metadata dari SEO Rank Math halaman WordPress pilar. */
export function pillarMetadata(pillar: Pillar): Metadata {
  const page = getPage(pillar.path);
  if (!page) return {};
  return metadataFromSeo(page.seo, { title: page.title, path: `/${pillar.path}/` });
}

/** Publikasi dari kategori terpetakan; dilengkapi publikasi terbaru bila terlalu sedikit. */
function pillarStories(pillar: Pillar): PostSummary[] {
  const stories = getAllPosts()
    .filter((p) => p.categories.some((c) => pillar.storyCategories.includes(c.slug)))
    .slice(0, PILLAR_STORY_COUNT);
  if (stories.length >= PILLAR_STORY_MIN) return stories;
  const seen = new Set(stories.map((s) => s.slug));
  const filler = getLatestPosts(PILLAR_STORY_COUNT).filter((p) => !seen.has(p.slug));
  return [...stories, ...filler].slice(0, PILLAR_STORY_COUNT);
}

/** Template artboard "04 · Pilar Program" — dipakai empat halaman pilar. Data: src/content/pillars.ts. */
export function PillarPage({ pillar }: { pillar: Pillar }) {
  if (!getPage(pillar.path)) notFound();
  const stories = pillarStories(pillar);

  return (
    <>
      <PageHero title={pillar.title} eyebrow="Pilar Program" image={pillar.hero} width="container" overlay={0.4} />

      {/* Tagline + deskripsi */}
      <section className="py-12 md:py-20">
        <div className="container-site grid items-center gap-6 md:grid-cols-2 md:gap-[60px]">
          <h2 className="text-[32px] leading-[1.05] font-extrabold italic lg:text-[45px]">{pillar.tagline}</h2>
          <p className="text-base leading-[1.6] text-ink">{pillar.description}</p>
        </div>
      </section>

      {/* Program */}
      <section className="bg-surface-alt py-12 md:py-[72px]">
        <div className="container-site">
          <h2 className="text-[28px] font-bold md:text-[36px]">{pillar.programsHeading}</h2>
          <ul className="mt-7 grid gap-4 md:mt-9 lg:grid-cols-2 lg:gap-6">
            {pillar.programs.map((program) => (
              <li key={program.title} className="flex items-start gap-4 rounded-[10px] bg-white p-5 shadow-card md:gap-5 md:p-7">
                <Image
                  src={mediaUrl(program.image.src)}
                  alt=""
                  width={program.image.width}
                  height={program.image.height}
                  sizes="96px"
                  className="size-16 shrink-0 rounded-[10px] object-cover md:size-24"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold md:text-xl">{program.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-[1.6] text-body">{program.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cerita Berdampak */}
      {stories.length > 0 && (
        <section className="py-12 md:py-[72px]">
          <div className="container-site">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-[28px] font-bold md:text-[36px]">Cerita Berdampak</h2>
              <Link
                href={pillar.storiesHref}
                className="inline-flex min-h-11 items-center rounded-full border-2 border-primary px-[18px] py-2 text-[15px] font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Lihat Semua Cerita
              </Link>
            </div>
            <div className="mt-7 md:mt-9">
              <Carousel
                label={`Cerita berdampak ${pillar.title}`}
                arrows="bottom-right"
                loop={false}
                slideClassName="basis-full sm:basis-1/2 lg:basis-1/3 pl-6 pb-5 pt-1"
                gapClassName="-ml-6"
              >
                {stories.map((post) => (
                  <div key={post.slug} className="h-full px-1">
                    <PostCard post={post} showExcerpt={false} />
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        </section>
      )}

      {/* CTA donasi */}
      <section className="pb-14 md:pb-20">
        <div className="container-site grid items-center gap-6 rounded-[20px] bg-primary p-7 text-white md:grid-cols-[2fr_1fr] md:gap-8 md:p-12">
          <div>
            <h2 className="text-[26px] leading-[1.2] font-bold text-white md:text-[34px]">{pillar.cta.heading}</h2>
            <p className="mt-3 text-base leading-[1.6]">{pillar.cta.description}</p>
          </div>
          <a
            href={pillar.cta.href}
            className="inline-flex min-h-11 items-center justify-center justify-self-start rounded-full bg-accent px-10 py-3.5 font-semibold text-ink transition-opacity hover:opacity-90 md:justify-self-end"
          >
            {pillar.cta.label}
          </a>
        </div>
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/" },
          { name: pillar.title, path: `/${pillar.path}/` },
        ])}
      />
    </>
  );
}
