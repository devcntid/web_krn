import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { pageLabels } from "@/content/localized";
import { Link } from "@/i18n/Link";
import { mediaUrl } from "@/lib/media";
import type { SectionData } from "@/server/sections";

import type { SectionContext } from "./types";

/** Grid kartu laporan per tahun dengan filter tema lewat ?tema= (artboard "09 · e-Report"). */
export function ReportsSection({ data, ctx }: { data: SectionData<"reports">; ctx: SectionContext }) {
  const L = pageLabels(ctx.locale);
  const tema = ctx.query.tema;
  const requested = Array.isArray(tema) ? tema[0] : tema;
  const active = data.themes.some((t) => t.slug === requested) ? (requested ?? null) : null;

  const visible = active ? data.items.filter((r) => r.themes.includes(active)) : data.items;
  const years = [...new Set(visible.map((r) => r.year))];
  const filters: { slug: string | null; label: string }[] = [{ slug: null, label: L.allReports }, ...data.themes];

  return (
    <section className="bg-surface-alt pt-10 pb-14 md:pt-16 md:pb-[88px]">
      <div className="container-site">
        <nav aria-label={L.reportFilter}>
          <ul className="flex flex-wrap gap-3">
            {filters.map((filter) => {
              const current = filter.slug === active;
              return (
                <li key={filter.label}>
                  <Link
                    href={filter.slug ? `/${ctx.path}/?tema=${filter.slug}` : `/${ctx.path}/`}
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
          {L.reportsShown(visible.length)}
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
                          {L.readReport}
                          <span className="sr-only">: {report.title} ({L.newTab})</span>
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
  );
}
