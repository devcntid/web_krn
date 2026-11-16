import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Minus, Plus } from "lucide-react";

import { getPage } from "@/lib/content";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { initLocale } from "@/i18n/request";
import { auditContent, englishSeo, pageLabels } from "@/content/localized";
import { getLocale } from "@/i18n/request";

type LangProps = { params: Promise<{ lang: string }> };

const PATH = "audit-keuangan";

/** Metadata dari SEO Rank Math halaman WordPress. */
export async function generateMetadata({ params }: LangProps): Promise<Metadata> {
  await initLocale(params);
  const page = await getPage(PATH);
  if (!page) return {};
  return metadataFromSeo(page.seo, { title: page.title, path: `/${PATH}/`, en: englishSeo.audit });
}

/** Rekonstruksi artboard "06 · Audit Keuangan". Data: src/content/audit.ts. */
export default async function AuditPage({ params }: LangProps) {
  await initLocale(params);
  const c = auditContent(getLocale());
  const L = pageLabels(getLocale());
  const page = await getPage(PATH);
  if (!page) notFound();

  return (
    <>
      <PageHero title={getLocale() === "en" ? englishSeo.audit.title : page.title} image={c.auditHero.image} size="compact" width="container" overlay={0.35} />

      <section className="py-12 md:py-20">
        <div className="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-[60px]">
          <div>
            <h2 className="text-[30px] leading-[1.1] font-extrabold md:text-[40px]">
              {c.auditIntro.heading[0]}
              <br />
              {c.auditIntro.heading[1]}
            </h2>
            <div className="mt-5 space-y-3.5 text-base leading-[1.7] text-body-strong">
              {c.auditIntro.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <p className="mt-7 inline-flex items-center rounded-full bg-primary/10 px-[18px] py-2.5 text-sm font-semibold text-primary">
              {c.auditIntro.badge}
            </p>
          </div>

          {/*
            Accordion native: <details name> hanya membuka satu tahun sekaligus dan sudah
            bisa dioperasikan keyboard serta diumumkan pembaca layar (expanded/collapsed) tanpa JS.
          */}
          <div className="flex flex-col gap-3">
            {c.auditReports.map((report, i) => (
              <details
                key={report.year}
                name="audit-keuangan"
                open={i === 0}
                className="group overflow-hidden rounded-[10px] border border-border bg-white"
              >
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 px-[22px] text-[17px] font-bold text-ink transition-colors group-open:bg-primary group-open:text-white hover:bg-surface-alt group-open:hover:bg-primary focus-visible:outline-offset-[-2px] [&::-webkit-details-marker]:hidden">
                  <span>{report.title}</span>
                  <Plus aria-hidden className="size-5 shrink-0 group-open:hidden" />
                  <Minus aria-hidden className="hidden size-5 shrink-0 group-open:block" />
                </summary>
                <div className="border-t border-border p-4 md:p-[22px]">
                  <iframe
                    src={c.auditPreviewUrl(report)}
                    title={L.auditFrame(report.title)}
                    loading="lazy"
                    allowFullScreen
                    className="block h-[420px] w-full rounded-md border-0 bg-surface-alt md:h-[560px]"
                  />
                  <div className="mt-4 flex justify-end">
                    <a
                      href={c.auditPdfUrl(report)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-[18px] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {L.viewPdf}
                      <span className="sr-only">
                        {" "}
                        {report.title} ({L.newTab})
                      </span>
                      <ExternalLink aria-hidden className="size-4" />
                    </a>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/" },
          { name: getLocale() === "en" ? englishSeo.audit.title : page.title, path: `/${PATH}/` },
        ])}
      />
    </>
  );
}
