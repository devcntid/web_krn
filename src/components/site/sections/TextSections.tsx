import { Fragment } from "react";
import Image from "next/image";

import { mediaUrl } from "@/lib/media";
import type { SectionData } from "@/server/sections";

/** Tagline besar + paragraf (artboard "04 · Pilar Program"). */
export function TextTagline({ data }: { data: SectionData<"text-tagline"> }) {
  return (
    <section className="py-12 md:py-20">
      <div className="container-site grid items-center gap-6 md:grid-cols-2 md:gap-[60px]">
        <h2 className="text-[32px] leading-[1.05] font-extrabold italic lg:text-[45px]">{data.heading}</h2>
        <p className="text-base leading-[1.6] text-ink">{data.body}</p>
      </div>
    </section>
  );
}

/** Judul + paragraf di kiri, sematan (flipbook/iframe) di kanan (artboard "05 · Profil"). */
export function TextEmbed({ data }: { data: SectionData<"text-embed"> }) {
  return (
    <section className="py-12 md:py-20">
      <div className="container-site grid items-center gap-8 lg:grid-cols-2 lg:gap-[60px]">
        <div>
          <h2 className="text-[30px] leading-[1.1] font-normal md:text-[40px]">
            {data.headingLead} <strong className="font-extrabold">{data.headingStrong}</strong>
          </h2>
          <p className="mt-5 text-base leading-[1.7] text-body-strong">{data.body}</p>
        </div>
        <div className="overflow-hidden rounded-[20px] bg-surface-alt shadow-card">
          <iframe src={data.embedSrc} title={data.embedTitle} loading="lazy" allowFullScreen className="block aspect-[4/3] w-full border-0" />
        </div>
      </div>
    </section>
  );
}

/** Kartu Visi (hijau) + daftar Misi bernomor (artboard "05 · Profil"). */
export function TextVision({ data }: { data: SectionData<"text-vision"> }) {
  return (
    <section className="bg-cream py-12 md:py-20">
      <div className="container-site grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-8">
        <div className="flex flex-col gap-4 rounded-[20px] bg-primary p-7 text-white md:p-10">
          <h2 className="text-[28px] font-bold text-white md:text-[34px]">{data.visionHeading}</h2>
          <p className="text-lg leading-[1.5] font-medium md:text-xl">
            {data.visionLines.map((line, i) =>
              i === 0 ? (
                line
              ) : (
                <Fragment key={line}>
                  <br className="max-xl:hidden" /> {line}
                </Fragment>
              ),
            )}
          </p>
        </div>
        <div className="rounded-[20px] bg-white p-7 md:p-10">
          <h2 className="text-[28px] font-bold md:text-[34px]">{data.missionHeading}</h2>
          <ol className="mt-6 flex flex-col gap-[18px]">
            {data.missionItems.map((item, i) => (
              <li key={item} className="flex items-start gap-4 text-base leading-[1.6] text-ink">
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-ink">
                  {i + 1}
                </span>
                <span className="pt-1">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Baris gambar + teks berselang-seling (halaman Program Kami). */
export function TextAlternating({ data }: { data: SectionData<"text-alternating"> }) {
  return (
    <section className="py-12 md:py-20">
      <div className="container-site">
        <h2 className="text-center text-[30px] leading-[1.1] font-extrabold italic md:text-[40px] lg:text-[45px]">{data.heading}</h2>
        <div className="mt-10 flex flex-col gap-10 md:mt-16 md:gap-16">
          {data.items.map((item, i) => (
            <div key={item.title} className="grid items-center gap-6 md:grid-cols-2 md:gap-[60px]">
              <div className={`relative aspect-[16/9] overflow-hidden rounded-[20px] bg-surface-alt ${i % 2 === 1 ? "md:order-2" : ""}`}>
                <Image src={mediaUrl(item.image.src)} alt="" fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
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
  );
}

/** Judul + kartu butir di kiri, gambar di kanan (artboard "08 · Kemitraan"). */
export function TextListImage({ data }: { data: SectionData<"text-list-image"> }) {
  return (
    <section className="pb-12 md:pb-20">
      <div className="container-site grid items-center gap-8 md:grid-cols-2 md:gap-10">
        <div>
          <h2 className="mb-6 text-center text-[28px] leading-[1.2] font-bold md:text-[34px]">{data.heading}</h2>
          <ul className="flex flex-col gap-3.5">
            {data.items.map((item) => (
              <li key={item.title} className="rounded-[10px] bg-white px-[22px] py-5 shadow-card">
                <h3 className="text-[17px] leading-[1.3] font-bold">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-body-strong">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <Image
          src={mediaUrl(data.image.src)}
          alt={data.image.alt}
          width={data.image.width}
          height={data.image.height}
          sizes="(min-width: 768px) 40vw, 90vw"
          className="mx-auto h-auto w-full max-w-[510px] rounded-[20px]"
        />
      </div>
    </section>
  );
}
