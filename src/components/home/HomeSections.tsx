import Image from "next/image";
import Link from "next/link";

import { featuredVideo, impactMap, intro, pillars, publications, reportCta, testimonials } from "@/content/home";
import { getPostsByCategory, getLatestPosts } from "@/lib/content";
import { formatDateLong } from "@/lib/format";
import { Carousel } from "@/components/ui/Carousel";
import { YouTubeFacade } from "@/components/home/YouTubeFacade";
import { mediaUrl } from "@/lib/media";

const outlineBtn =
  "inline-flex self-start items-center justify-center rounded-full border-2 border-primary px-4 py-2 text-[15px] font-medium text-primary transition-colors hover:bg-primary hover:text-white";

/* ---------- Intro + video + peta ---------- */

export function IntroSection() {
  const nf = new Intl.NumberFormat("id-ID", { useGrouping: false });
  return (
    <section className="relative py-16 lg:pt-[110px]">
      {/* Label vertikal "Scroll Untuk Eksplorasi" */}
      <div className="absolute top-10 left-6 hidden flex-col items-center gap-2 xl:flex" aria-hidden>
        <Image src={mediaUrl(intro.scrollIcon)} alt="" width={40} height={40} unoptimized />
        <p className="text-xs leading-[1.3] font-extralight text-ink">
          Scroll
          <br />
          Untuk
          <br />
          Eksplorasi
        </p>
      </div>

      <div className="container-site">
        <div className="grid gap-8 md:grid-cols-2 md:gap-[5.5%]">
          <h2 className="max-md:text-center">
            <span className="block text-[22px] leading-none font-bold lg:text-[28px]">{intro.eyebrow}</span>
            <span className="mt-2 block text-[34px] leading-none font-extrabold italic lg:text-[45px]">{intro.heading}</span>
          </h2>
          <div className="space-y-4 text-base leading-[1.45] text-ink max-md:text-center">
            {intro.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <YouTubeFacade id={featuredVideo.youtubeId} title={featuredVideo.title} />
        </div>

        {/* Peta sebaran + statistik */}
        <div className="mt-14 grid overflow-hidden md:grid-cols-[75%_25%]">
          <Image
            src={mediaUrl(impactMap.image.src)}
            alt={impactMap.alt}
            width={impactMap.image.width}
            height={impactMap.image.height}
            sizes="(min-width: 768px) 60vw, 90vw"
            className="h-auto w-full self-start"
          />
          <div className="rounded-b-[20px] bg-primary px-5 py-8 text-white md:rounded-[0_0_20px_0]">
            <h2 className="text-xl leading-[1.3] font-bold text-white">{impactMap.heading}</h2>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-1">
              {impactMap.stats.map((s) => (
                <div key={s.label} className="flex items-center gap-4">
                  <Image src={mediaUrl(s.icon)} alt="" width={86} height={80} className="size-[70px] shrink-0 lg:size-[86px]" />
                  <div>
                    <dd className="text-2xl leading-none font-bold">{nf.format(s.value)}</dd>
                    <dt className="mt-1 text-sm leading-[1.25]">{s.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Pilar program ---------- */

export function PillarsSection() {
  return (
    <section className="pb-16">
      <div className="container-site">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="text-[24px] leading-[1.3] font-bold lg:text-[28px]">
            {pillars.heading[0]}
            <br />
            {pillars.heading[1]}
          </h2>
          <Link href={pillars.cta.href} className={outlineBtn}>
            {pillars.cta.label}
          </Link>
        </div>

        <ul className="mt-14 grid gap-8 sm:grid-cols-2">
          {pillars.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group relative flex aspect-[461/260] items-end overflow-hidden rounded-[10px] p-7 shadow-card"
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
                  <h3 className="text-[26px] leading-[1.2] font-bold text-white lg:text-[30px]">{item.title}</h3>
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

export function PublicationsSection() {
  const berita = getPostsByCategory("berita");
  const posts = (berita.length ? berita : getLatestPosts(publications.count)).slice(0, publications.count);
  if (!posts.length) return null;

  return (
    <section className="pb-20">
      <div className="container-site">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[28px] font-bold">{publications.heading}</h2>
          <Link href={publications.cta.href} className={outlineBtn}>
            {publications.cta.label}
          </Link>
        </div>
        <div className="mt-14 lg:px-[60px]">
          <Carousel
            label="Publikasi terbaru"
            arrows="side-round"
            autoplayMs={6000}
            slideClassName="basis-full sm:basis-1/2 lg:basis-1/3 pl-[30px]"
            gapClassName="-ml-[30px]"
          >
            {posts.map((post) => (
              <article key={post.slug} className="h-full">
                <Link href={`/${post.slug}/`} className="relative block aspect-[258/145] overflow-hidden rounded-[20px] bg-surface-alt">
                  {post.featuredImage && (
                    <Image src={mediaUrl(post.featuredImage.src)} alt={post.featuredImage.alt} fill sizes="(min-width: 1024px) 260px, 90vw" className="object-cover" />
                  )}
                </Link>
                <div className="px-1">
                  <h3 className="mt-6 line-clamp-3 text-lg leading-[1.3] font-bold">
                    <Link href={`/${post.slug}/`} className="hover:text-primary">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-4 line-clamp-3 text-sm leading-[1.7] text-body-soft">{post.excerpt}</p>
                  <time dateTime={post.date} className="mt-8 block text-xs text-body-soft">
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
  return (
    <section className="pb-20">
      <div className="container-site text-center">
        <h2 className="text-[30px] font-bold lg:text-[36px]">{testimonials.heading}</h2>
        <p className="mx-auto mt-2 text-lg leading-[1.35] text-muted">{testimonials.description}</p>
      </div>
      <div className="container-site mt-8">
        <Carousel
          label="Testimoni"
          arrows="none"
          dots
          autoplayMs={7000}
          slideClassName="basis-full md:basis-1/3 pl-5"
          gapClassName="-ml-5"
        >
          {testimonials.items.map((t) => (
            <figure key={t.name} className="flex h-full flex-col text-left">
              <blockquote className="flex flex-1 items-center bg-surface-muted p-[10px] text-[15px] leading-[1.75] text-body italic">
                <p>“{t.quote}”</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4 px-[10px]">
                <Image src={mediaUrl(t.photo)} alt={t.name} width={60} height={60} className="size-[60px] shrink-0 rounded-full object-cover" />
                <span>
                  <span className="block text-sm leading-[1.4] text-body">{t.name}</span>
                  <span className="block text-sm leading-[1.4] font-bold text-primary-400">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

/* ---------- CTA e-Report ---------- */

export function ReportCtaSection() {
  return (
    <section className="relative py-12">
      <Image src={mediaUrl(reportCta.background)} alt="" fill sizes="100vw" className="object-cover" />
      <div className="container-site relative rounded-[20px] bg-[rgba(217,217,217,0.88)] px-6 py-10 lg:px-[50px]">
        <h2 className="text-[26px] font-bold lg:text-[32px]">{reportCta.heading}</h2>
        <p className="mt-3 max-w-[810px] text-base leading-[1.5] text-ink lg:text-lg">{reportCta.description}</p>
        <Link
          href={reportCta.cta.href}
          className="mt-8 inline-flex rounded-full bg-accent px-[50px] py-3 text-base font-semibold text-ink transition-opacity hover:opacity-90"
        >
          {reportCta.cta.label}
        </Link>
      </div>
    </section>
  );
}
