import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { profileAbout, profileHero, profileMission, profileTransparency, profileVision } from "@/content/profile";
import { getPage } from "@/lib/content";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";

const PATH = "profil-relawan-nusantara";

/** Metadata dari SEO Rank Math halaman WordPress. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(PATH);
  if (!page) return {};
  return metadataFromSeo(page.seo, { title: page.title, path: `/${PATH}/` });
}

/** Rekonstruksi artboard "05 · Profil". Teks: src/content/profile.ts (verbatim dari WordPress). */
export default async function ProfilePage() {
  const page = await getPage(PATH);
  if (!page) notFound();

  return (
    <>
      <PageHero title={page.title} image={profileHero.image} size="medium" width="container" overlay={0.35} />

      {/* Apa itu Relawan Nusantara? */}
      <section className="py-12 md:py-20">
        <div className="container-site grid items-center gap-8 lg:grid-cols-2 lg:gap-[60px]">
          <div>
            <h2 className="text-[30px] leading-[1.1] font-normal md:text-[40px]">
              {profileAbout.heading.lead} <strong className="font-extrabold">{profileAbout.heading.strong}</strong>
            </h2>
            <p className="mt-5 text-base leading-[1.7] text-body-strong">{profileAbout.body}</p>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-surface-alt shadow-card">
            <iframe
              src={profileAbout.embed.src}
              title={profileAbout.embed.title}
              loading="lazy"
              allowFullScreen
              className="block aspect-[4/3] w-full border-0"
            />
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="bg-cream py-12 md:py-20">
        <div className="container-site grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-8">
          <div className="flex flex-col gap-4 rounded-[20px] bg-primary p-7 text-white md:p-10">
            <h2 className="text-[28px] font-bold text-white md:text-[34px]">{profileVision.heading}</h2>
            <p className="text-lg leading-[1.5] font-medium md:text-xl">
              {profileVision.lines[0]}
              <br className="max-xl:hidden" /> {profileVision.lines[1]}
            </p>
          </div>
          <div className="rounded-[20px] bg-white p-7 md:p-10">
            <h2 className="text-[28px] font-bold md:text-[34px]">{profileMission.heading}</h2>
            <ol className="mt-6 flex flex-col gap-[18px]">
              {profileMission.items.map((item, i) => (
                <li key={item} className="flex items-start gap-4 text-base leading-[1.6] text-ink">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-ink"
                  >
                    {i + 1}
                  </span>
                  <span className="pt-1">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Tautan Audit / Legalitas / e-Report */}
      <section className="py-12 md:py-20">
        <div className="container-site">
          <h2 className="text-[28px] font-bold md:text-[34px]">{profileTransparency.heading}</h2>
          <p className="mt-2.5 max-w-[810px] text-base text-body">{profileTransparency.description}</p>
          <ul className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6">
            {profileTransparency.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex h-full flex-col gap-2.5 rounded-xl border border-border p-6 text-ink transition-colors hover:border-primary md:p-7"
                >
                  <span className="text-xl font-bold">{link.title}</span>
                  <span className="flex-1 text-sm leading-[1.6] text-body">{link.description}</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {link.cta}
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
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
