import type { Page } from "@/types/content";
import { prepareLegacyHtml } from "@/lib/legacy-html";
import { PageHero } from "@/components/sections/PageHero";
import { RichContent } from "@/components/content/RichContent";

/**
 * Template untuk halaman WordPress yang belum direkonstruksi sebagai komponen
 * khusus: hero + konten HTML hasil ekspor (dirapikan oleh prepareLegacyHtml,
 * gaya `.wp-page` di globals.css).
 */
export function GenericPageTemplate({ page }: { page: Page }) {
  const html = prepareLegacyHtml(page.html, page.title);
  return (
    <>
      <PageHero title={page.title} size="small" width="container" />
      <div className="container-site py-10 md:py-14">
        {html ? (
          <RichContent html={html} className="wp-page mx-auto max-w-[920px]" />
        ) : (
          <p className="text-body">Konten halaman ini belum tersedia.</p>
        )}
      </div>
    </>
  );
}
