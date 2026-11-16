import { Fragment } from "react";
import Image from "next/image";
import { ArrowRight, FileText } from "lucide-react";

import { Link } from "@/i18n/Link";
import { mediaUrl } from "@/lib/media";
import type { SectionData } from "@/server/sections";

/** Angka ringkas dalam kartu bergaris (halaman Kerelawanan & Kebencanaan). */
export function CardsStats({ data }: { data: SectionData<"cards-stats"> }) {
  return (
    <section className="pb-12 md:pb-20">
      <ul className="container-site grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {data.items.map((stat) => (
          <li key={stat.title} className="rounded-[10px] border border-border p-5 md:p-6">
            <h3 className="text-xl font-bold text-primary md:text-2xl">{stat.title}</h3>
            <p className="mt-2 text-sm leading-[1.6] text-body">{stat.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Kartu program: gambar kecil + judul + deskripsi (artboard "04 · Pilar Program"). */
export function CardsPrograms({ data }: { data: SectionData<"cards-programs"> }) {
  return (
    <section className="bg-surface-alt py-12 md:py-[72px]">
      <div className="container-site">
        <h2 className="text-[28px] font-bold md:text-[36px]">{data.heading}</h2>
        <ul className="mt-7 grid gap-4 md:mt-9 lg:grid-cols-2 lg:gap-6">
          {data.items.map((program) => (
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
  );
}

/** Kartu besar bergambar dengan tautan (empat pilar di halaman Program Kami). */
export function CardsPillars({ data }: { data: SectionData<"cards-pillars"> }) {
  return (
    <section className="bg-surface-alt py-12 md:py-[72px]">
      <div className="container-site">
        <h2 className="text-[28px] leading-[1.2] font-bold md:text-[36px]">
          {data.headingLines.map((line, i) =>
            i === 0 ? (
              line
            ) : (
              <Fragment key={line}>
                <br />
                {line}
              </Fragment>
            ),
          )}
        </h2>
        <ul className="mt-7 grid gap-5 md:mt-9 md:grid-cols-2 md:gap-6">
          {data.items.map((item) => (
            <li key={item.href} className="flex flex-col overflow-hidden rounded-[10px] bg-white shadow-card">
              <div className="relative aspect-[661/320] bg-surface-alt">
                <Image src={mediaUrl(item.image.src)} alt="" fill sizes="(min-width: 768px) 45vw, 90vw" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-5 md:p-7">
                <h3 className="text-xl font-bold md:text-2xl">{item.title}</h3>
                <p className="mt-3 flex-1 text-[15px] leading-[1.6] text-body">{item.description}</p>
                <Link href={item.href} className="group mt-4 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-primary">
                  {data.linkLabel}
                  <span className="sr-only">: {item.title}</span>
                  <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Kartu tautan bergaris (Audit / Legalitas / e-Report di halaman Profil). */
export function CardsLinks({ data }: { data: SectionData<"cards-links"> }) {
  return (
    <section className="py-12 md:py-20">
      <div className="container-site">
        <h2 className="text-[28px] font-bold md:text-[34px]">{data.heading}</h2>
        <p className="mt-2.5 max-w-[810px] text-base text-body">{data.description}</p>
        <ul className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6">
          {data.items.map((link) => (
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
  );
}

/** Langkah berikon di tengah (artboard "08 · Kemitraan"). */
export function CardsSteps({ data }: { data: SectionData<"cards-steps"> }) {
  return (
    <section className="py-12 md:py-20">
      <div className="container-site text-center">
        <h2 className="text-[30px] leading-[1.15] font-extrabold md:text-[40px] lg:text-[45px]">{data.heading}</h2>
        <ol className="mt-9 grid gap-8 sm:grid-cols-2 md:mt-12 lg:grid-cols-4 lg:gap-7">
          {data.items.map((step) => (
            <li key={step.title} className="flex flex-col items-center gap-3.5">
              <Image src={mediaUrl(step.icon.src)} alt="" width={step.icon.width} height={step.icon.height} sizes="88px" className="size-[88px]" />
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-[15px] leading-[1.6] text-body-strong">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Pengantar + daftar dokumen berikon (artboard "07 · Asas Legalitas"). */
export function CardsDocs({ data }: { data: SectionData<"cards-docs"> }) {
  return (
    <section className="pt-12 pb-14 md:pt-[72px] md:pb-[88px]">
      <div className="container-site">
        <p className="max-w-[820px] text-base leading-[1.6] text-ink md:text-lg">{data.intro}</p>
        <ol className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 md:gap-5">
          {data.items.map((doc) => (
            <li key={doc.kind} className="flex items-start gap-[18px] rounded-xl border border-border p-5 md:p-6">
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <FileText className="size-[22px]" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[13px] leading-[1.4] font-bold tracking-[0.06em] text-primary uppercase">{doc.kind}</h2>
                <p className="mt-1.5 text-[15px] leading-[1.6] break-words text-ink-900">{doc.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
