import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

import { legalDocs, legalHero, legalIntro } from "@/content/legal";
import { getPage } from "@/lib/content";
import { breadcrumbJsonLd, metadataFromSeo } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";

const PATH = "asas-legalitas";

/** Metadata dari SEO Rank Math halaman WordPress. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(PATH);
  if (!page) return {};
  return metadataFromSeo(page.seo, { title: page.title, path: `/${PATH}/` });
}

/** Rekonstruksi artboard "07 · Asas Legalitas". Data: src/content/legal.ts. */
export default async function LegalPage() {
  const page = await getPage(PATH);
  if (!page) notFound();

  return (
    <>
      <PageHero title={page.title} image={legalHero.image} size="small" width="container" overlay={0.35} />

      <section className="pt-12 pb-14 md:pt-[72px] md:pb-[88px]">
        <div className="container-site">
          <p className="max-w-[820px] text-base leading-[1.6] text-ink md:text-lg">{legalIntro}</p>
          <ol className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2 md:gap-5">
            {legalDocs.map((doc) => (
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

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Beranda", path: "/" },
          { name: page.title, path: `/${PATH}/` },
        ])}
      />
    </>
  );
}
