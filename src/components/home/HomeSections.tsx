import Image from "next/image";
import { Link } from "@/i18n/Link";

import { homeContent, pageLabels } from "@/content/localized";
import { getLocale } from "@/i18n/request";
import { getPostsByCategory, getLatestPosts } from "@/lib/content";
import { formatDateLong } from "@/lib/format";
import { Carousel } from "@/components/ui/Carousel";
import { YouTubeFacade } from "@/components/home/YouTubeFacade";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { mediaUrl } from "@/lib/media";

const outlineBtn =
  "inline-flex min-h-11 self-start items-center justify-center rounded-full border-2 border-primary px-4 py-2 text-sm md:text-[15px] font-medium text-primary transition-colors hover:bg-primary hover:text-white";

/* ---------- Intro + video + peta ---------- */

export function IntroSection() {
  const c = homeContent(getLocale());
  return (
    <section className="relative pt-7 pb-10 md:py-16 lg:pt-[100px]">
      {/* Label vertikal "Scroll Untuk Eksplorasi" */}
      <div className="absolute top-10 left-6 hidden flex-col items-center gap-2 xl:flex" aria-hidden>
        <Image src={mediaUrl(c.intro.scrollIcon)} alt="" width={40} height={40} unoptimized />
        <p className="text-xs leading-[1.3] font-extralight text-ink">
          {(getLocale() === "en" ? ["Scroll", "to", "Explore"] : ["Scroll", "Untuk", "Eksplorasi"]).map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </p>
      </div>

      <div className="container-site">
        <div className="grid gap-[18px] md:grid-cols-2 md:gap-[5.5%] lg:gap-[60px]">
          <h2 className="max-md:text-center">
            <span className="block text-[22px] leading-none font-bold lg:text-[28px]">{c.intro.eyebrow}</span>
            <span className="mt-1.5 block text-[32px] leading-[1.05] font-extrabold italic md:mt-2 md:leading-none lg:text-[45px]">{c.intro.heading}</span>
          </h2>
          <div className="space-y-3 text-[15px] leading-[1.5] text-ink max-md:text-center md:space-y-4 md:text-base md:leading-[1.45]">
            {c.intro.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <div className="mt-6 md:mt-14">
          <YouTubeFacade id={c.featuredVideo.youtubeId} title={c.featuredVideo.title} />
        </div>

        {/* Peta sebaran + statistik */}
        <div className="mt-7 grid overflow-hidden md:mt-14 md:grid-cols-[75%_25%]">
          <Image
            src={mediaUrl(c.impactMap.image.src)}
            alt={c.impactMap.alt}
            width={c.impactMap.image.width}
            height={c.impactMap.image.height}
            sizes="(min-width: 768px) 60vw, 90vw"
            className="h-auto w-full self-start"
          />
          <div className="rounded-b-2xl bg-primary p-[22px] text-white md:rounded-[0_0_20px_0] md:py-8">
            <h2 className="text-lg leading-[1.3] font-bold text-white md:text-xl">{c.impactMap.heading}</h2>
            <ul className="mt-4 grid grid-cols-2 gap-4 md:mt-[22px] md:grid-cols-1 md:gap-[22px]">
              {c.impactMap.stats.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 md:gap-3.5">
                  <Image
                    src={mediaUrl(s.icon)}
                    alt=""
                    width={c.impactMap.iconSize.width}
                    height={c.impactMap.iconSize.height}
                    sizes="72px"
                    className="h-auto w-11 shrink-0 md:w-14 lg:w-[72px]"
                  />
                  <p className="min-w-0">
                    <span className="block text-[22px] leading-none font-bold md:text-2xl">{s.value}</span>
                    <span className="mt-1 block text-[13px] leading-[1.25] md:text-sm">{s.label}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Pilar program ---------- */

export function PillarsSection() {
  const c = homeContent(getLocale());
  return (
    <section className="pb-10 md:pb-16">
      <div className="container-site">
        <div className="flex flex-col gap-3.5 md:flex-row md:items-end md:justify-between md:gap-6">
          <h2 className="text-[22px] leading-[1.3] font-bold md:text-[24px] lg:text-[28px]">
            {c.pillars.heading[0]} <br className="max-md:hidden" />
            {c.pillars.heading[1]}
          </h2>
          <Link href={c.pillars.cta.href} className={outlineBtn}>
            {c.pillars.cta.label}
          </Link>
        </div>

        <ul className="mt-5 grid gap-3.5 sm:grid-cols-2 md:mt-14 md:gap-8">
          {c.pillars.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group relative flex h-[150px] items-end overflow-hidden rounded-[10px] p-[18px] shadow-card md:aspect-[461/260] md:h-auto md:p-7"
              >
                <Image
                  src={mediaUrl(item.image)}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-black/45 transition-colors group-hover:bg-primary/80" aria-hidden />
                <div className="relative">
                  <h3 className="text-2xl leading-[1.2] font-bold text-white md:text-[26px] lg:text-[30px]">{item.title}</h3>
                  <p className="mt-2 max-h-0 overflow-hidden text-sm leading-[1.5] text-white opacity-0 transition-all duration-300 group-focus-visible:max-h-40 group-focus-visible:opacity-100 group-hover:max-h-40 group-hover:opacity-100">
                    {item.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Publikasi ---------- */

export async function PublicationsSection() {
  const c = homeContent(getLocale());
  const berita = await getPostsByCategory("berita");
  const posts = (berita.length ? berita : (await getLatestPosts(c.publications.count))).slice(0, c.publications.count);
  if (!posts.length) return null;

  return (
    <section className="pb-10 md:pb-20">
      <div className="container-site">
        <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between md:gap-6">
          <h2 className="text-2xl font-bold md:text-[28px]">{c.publications.heading}</h2>
          <Link href={c.publications.cta.href} className={outlineBtn}>
            {c.publications.cta.label}
          </Link>
        </div>
        <div className="mt-5 md:mt-14 lg:px-[60px]">
          <Carousel
            label={pageLabels(getLocale()).latestPublications}
            arrows="side-round"
            arrowsClassName="max-md:hidden md:[--arrow-top:93px] lg:[--arrow-top:81px]"
            dots
            dotsClassName="md:hidden"
            autoplayMs={6000}
            slideClassName="basis-full sm:basis-1/2 lg:basis-1/3 pl-[30px]"
            gapClassName="-ml-[30px]"
          >
            {posts.map((post) => (
              <article key={post.slug} className="h-full">
                <Link href={`/${post.slug}/`} className="relative block aspect-[258/145] overflow-hidden rounded-2xl bg-surface-alt md:rounded-[20px]">
                  {post.featuredImage && (
                    <Image src={mediaUrl(post.featuredImage.src)} alt={post.featuredImage.alt} fill sizes="(min-width: 1024px) 260px, 90vw" className="object-cover" />
                  )}
                </Link>
                <div className="px-1">
                  <h3 className="mt-4 line-clamp-3 text-[17px] leading-[1.35] font-bold md:mt-6 md:text-lg md:leading-[1.3]">
                    <Link href={`/${post.slug}/`} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-4 line-clamp-3 text-sm leading-[1.7] text-body-soft max-md:hidden">{post.excerpt}</p>
                  <time dateTime={post.date} className="mt-2.5 block text-[13px] text-body-soft md:mt-7 md:text-xs">
                    {formatDateLong(post.date)}
                  </time>
                </div>
              </article>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimoni ---------- */

export function TestimonialsSection() {
  const c = homeContent(getLocale());
  return (
    <section className="pb-10 md:pb-20">
      <div className="container-site text-center">
        <h2 className="text-[26px] font-bold md:text-[30px] lg:text-[36px]">{c.testimonials.heading}</h2>
        <p className="mx-auto mt-2 text-[15px] leading-[1.35] text-muted-strong md:text-lg">{c.testimonials.description}</p>
      </div>
      <div className="container-site mt-[18px] md:mt-8">
        <TestimonialCarousel items={c.testimonials.items} />
      </div>
    </section>
  );
}

/* ---------- CTA e-Report ---------- */

export function ReportCtaSection() {
  const c = homeContent(getLocale());
  return (
    <section className="relative py-7 md:py-12">
      <Image src={mediaUrl(c.reportCta.background)} alt="" fill sizes="100vw" className="object-cover" />
      <div className="container-site relative rounded-2xl bg-[rgba(217,217,217,0.88)] p-6 md:rounded-[20px] md:py-10 lg:px-[50px]">
        <h2 className="text-[22px] font-bold md:text-[26px] lg:text-[32px]">{c.reportCta.heading}</h2>
        <p className="mt-2.5 max-w-[810px] text-sm leading-[1.5] text-ink md:mt-3 md:text-base lg:text-lg">{c.reportCta.description}</p>
        <Link
          href={c.reportCta.cta.href}
          className="mt-[18px] inline-flex min-h-11 items-center rounded-full bg-accent px-8 py-3 text-sm font-semibold text-ink transition-opacity hover:opacity-90 md:mt-8 md:px-[50px] md:text-base"
        >
          {c.reportCta.cta.label}
        </Link>
      </div>
    </section>
  );
}
