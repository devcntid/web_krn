import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { reportThemes, reports, reportsPage, type ReportTheme } from "@/content/reports";
import { getPage } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";

const PATH = "e-report";

type Props = { searchParams: Promise<{ tema?: string | string[] }> };

/** Metadata Rank Math + meta description (kosong di halaman asli). Canonical tanpa ?tema=. */
export function generateMetadata(): Metadata {
  const page = getPage(PATH);
  if (!page) return {};
  return metadataFromSeo(page.seo, { title: page.title, path: `/${PATH}/`, description: reportsPage.description });
}

const isTheme = (value: string | undefined): value is ReportTheme => reportThemes.some((t) => t.slug === value);

/** Rekonstruksi artboard "09 · e-Report": filter tema via ?tema= dan grid kartu laporan per tahun. */
export default async function EReportPage({ searchParams }: Props) {
  const page = getPage(PATH);
  if (!page) notFound();

  const { tema } = await searchParams;
  const requested = Array.isArray(tema) ? tema[0] : tema;
  const active = isTheme(requested) ? requested : null;

  const visible = active ? reports.filter((r) => r.themes.includes(active)) : reports;
  const years = [...new Set(visible.map((r) => r.year))];
  const filters = [{ slug: null, label: "Semua" }, ...reportThemes];

  return (
    <>
      <PageHero
        title={page.title}
        subtitle={reportsPage.description}
        image={reportsPage.hero}
        size="small"
        width="container"
        overlay={0.5}
      />

      <section className="bg-surface-alt pt-10 pb-14 md:pt-16 md:pb-[88px]">
        <div className="container-site">
          <nav aria-label="Filter tema laporan">
            <ul className="flex flex-wrap gap-3">
              {filters.map((filter) => {
                const current = filter.slug === active;
                return (
                  <li key={filter.label}>
                    <Link
                      href={filter.slug ? `/${PATH}/?tema=${filter.slug}` : `/${PATH}/`}
                      scroll={false}
                      aria-current={current ? "true" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-[10px] border-2 border-primary px-5 text-sm font-medium transition-colors ${
                        current ? "bg-primary text-white" : "bg-white text-ink hover:bg-primary/10"
                      }`}
                    >
                      {filter.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className="sr-only" role="status">
            {visible.length} laporan ditampilkan
          </p>

          {years.map((year) => (
            <section key={year} aria-labelledby={`tahun-${year}`} className="mt-8 md:mt-10">
              <h2 id={`tahun-${year}`} className="text-[26px] font-bold md:text-[32px]">
                {year}
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
                {visible
                  .filter((r) => r.year === year)
                  .map((report) => (
                    <li key={report.url}>
                      <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-card">
                        <Image
                          src={mediaUrl(report.cover.src)}
                          alt=""
                          width={report.cover.width}
                          height={report.cover.height}
                          sizes="(min-width: 1024px) 340px, 45vw"
                          className="aspect-[1414/2000] w-full bg-surface-muted object-cover"
                        />
                        <div className="flex flex-1 flex-col gap-3.5 p-3.5 md:p-[18px]">
                          <h3 className="text-[15px] leading-[1.35] font-bold md:text-[17px]">{report.title}</h3>
                          <a
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg bg-primary px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap text-white transition-opacity hover:opacity-90 md:px-[18px] md:text-sm"
                          >
                            Baca Laporan
                            <span className="sr-only">: {report.title} (tab baru)</span>
                            <ArrowUpRight aria-hidden className="size-4" />
                          </a>
                        </div>
                      </article>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
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
