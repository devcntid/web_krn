import type { Page } from "@/types/content";
import { PageHero } from "@/components/sections/PageHero";
import { RichContent } from "@/components/content/RichContent";

/**
 * Template sementara untuk halaman WordPress yang belum direkonstruksi
 * sebagai komponen khusus: hero + konten HTML hasil ekspor.
 */
export function GenericPageTemplate({ page }: { page: Page }) {
  return (
    <>
      <PageHero title={page.title} />
      <div className="container-site py-12">
        <RichContent html={page.html} />
      </div>
    </>
  );
}
