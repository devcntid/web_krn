import { RichContent } from "@/components/content/RichContent";
import { prepareLegacyHtml } from "@/lib/legacy-html";
import type { SectionData } from "@/server/sections";

import type { SectionContext } from "./types";

/** Teks bebas (HTML tersanitasi) dengan gaya halaman generik `.wp-page`. */
export function RichtextSection({ data, ctx }: { data: SectionData<"richtext">; ctx: SectionContext }) {
  const html = prepareLegacyHtml(data.html, ctx.title);
  if (!html) return null;
  return (
    <section className="container-site py-10 md:py-14">
      <RichContent html={html} className="wp-page mx-auto max-w-[920px]" />
    </section>
  );
}
