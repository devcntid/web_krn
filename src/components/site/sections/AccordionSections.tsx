import { Fragment } from "react";
import { ExternalLink, Minus, Plus } from "lucide-react";

import { RichContent } from "@/components/content/RichContent";
import { pageLabels } from "@/content/localized";
import type { SectionData } from "@/server/sections";

import type { SectionContext } from "./types";

const summaryClass =
  "flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 px-[22px] text-[17px] font-bold text-ink transition-colors group-open:bg-primary group-open:text-white hover:bg-surface-alt group-open:hover:bg-primary focus-visible:outline-offset-[-2px] [&::-webkit-details-marker]:hidden";

/**
 * Teks pengantar + accordion dokumen tersemat (artboard "06 · Audit Keuangan").
 * Accordion native: <details name> hanya membuka satu butir sekaligus dan sudah bisa
 * dioperasikan keyboard serta diumumkan pembaca layar tanpa JS.
 */
export function AccordionDocs({ data, ctx }: { data: SectionData<"accordion-docs">; ctx: SectionContext }) {
  const L = pageLabels(ctx.locale);
  return (
    <section className="py-12 md:py-20">
      <div className="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-[60px]">
        <div>
          <h2 className="text-[30px] leading-[1.1] font-extrabold md:text-[40px]">
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
          <div className="mt-5 space-y-3.5 text-base leading-[1.7] text-body-strong">
            {data.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {data.badge ? (
            <p className="mt-7 inline-flex items-center rounded-full bg-primary/10 px-[18px] py-2.5 text-sm font-semibold text-primary">{data.badge}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {data.items.map((item, i) => (
            <details key={item.title} name={ctx.path.replace(/\//g, "-")} open={i === 0} className="group overflow-hidden rounded-[10px] border border-border bg-white">
              <summary className={summaryClass}>
                <span>{item.title}</span>
                <Plus aria-hidden className="size-5 shrink-0 group-open:hidden" />
                <Minus aria-hidden className="hidden size-5 shrink-0 group-open:block" />
              </summary>
              <div className="border-t border-border p-4 md:p-[22px]">
                <iframe
                  src={item.previewUrl}
                  title={L.auditFrame(item.title)}
                  loading="lazy"
                  allowFullScreen
                  className="block h-[420px] w-full rounded-md border-0 bg-surface-alt md:h-[560px]"
                />
                <div className="mt-4 flex justify-end">
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-[18px] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {L.viewPdf}
                    <span className="sr-only">
                      {" "}
                      {item.title} ({L.newTab})
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
  );
}

/** Accordion teks (tanya-jawab) untuk halaman baru; gaya butir sama dengan accordion dokumen. */
export function AccordionText({ data, ctx }: { data: SectionData<"accordion">; ctx: SectionContext }) {
  return (
    <section className="py-12 md:py-20">
      <div className="container-site">
        {data.heading ? <h2 className="text-[28px] font-bold md:text-[36px]">{data.heading}</h2> : null}
        <div className={`flex flex-col gap-3 ${data.heading ? "mt-7 md:mt-9" : ""}`}>
          {data.items.map((item) => (
            <details key={item.title} name={`${ctx.path.replace(/\//g, "-")}-accordion`} className="group overflow-hidden rounded-[10px] border border-border bg-white">
              <summary className={summaryClass}>
                <span>{item.title}</span>
                <Plus aria-hidden className="size-5 shrink-0 group-open:hidden" />
                <Minus aria-hidden className="hidden size-5 shrink-0 group-open:block" />
              </summary>
              <div className="border-t border-border p-4 md:p-[22px]">
                <RichContent html={item.body} className="wp-page" />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
